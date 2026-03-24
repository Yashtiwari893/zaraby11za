// src/lib/features/reminderChecker.ts
// Free plan fix: Webhook ke andar bhi due reminders check karo
// Taaki har incoming message pe reminders fire hote rahen (minute-level accuracy)

import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'
import type { Language } from '@/lib/whatsapp/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Last check timestamp — same process mein baar baar DB hit na ho
let lastCheckTime = 0
const CHECK_INTERVAL_MS = 60 * 1000 // 1 minute minimum gap

export async function checkAndFireDueReminders(): Promise<void> {
  const now = Date.now()

  // 1 minute se kam mein dobara check mat karo (same serverless instance)
  if (now - lastCheckTime < CHECK_INTERVAL_MS) return
  lastCheckTime = now

  try {
    const { data: dueReminders, error } = await supabase
      .from('due_reminders_view')
      .select('reminder_id, user_id, title, note, recurrence, recurrence_time, phone, language')

    if (error || !dueReminders || dueReminders.length === 0) return

    console.log(`[reminderChecker] ${dueReminders.length} due reminders found via webhook trigger`)

    for (const reminder of dueReminders) {
      try {
        const lang = (reminder.language as Language) ?? 'en'
        const noteText = reminder.note ? `\n📌 ${reminder.note}` : ''
        const message = lang === 'hi'
          ? `⏰ *Reminder*\n\n📝 ${reminder.title}${noteText}\n\n_Done? "done" likho। Snooze? "snooze" likho।_`
          : `⏰ *Reminder*\n\n📝 ${reminder.title}${noteText}\n\n_Done? Reply "done". Snooze? Reply "snooze"._`

        await sendWhatsAppMessage({ to: reminder.phone, message })

        if (reminder.recurrence && reminder.recurrence !== 'none' && reminder.recurrence_time) {
          const nextDate = getNextRecurrenceDate(reminder.recurrence, reminder.recurrence_time)
          await supabase.from('reminders')
            .update({ scheduled_at: nextDate.toISOString(), status: 'pending' })
            .eq('id', reminder.reminder_id)
        } else {
          await supabase.from('reminders')
            .update({ status: 'sent' })
            .eq('id', reminder.reminder_id)
        }
      } catch (err) {
        console.error(`[reminderChecker] Failed for ${reminder.reminder_id}:`, err)
      }
    }
  } catch (err) {
    // Silent fail — reminder check webhook ko block nahi karna chahiye
    console.error('[reminderChecker] Error:', err)
  }
}

function getNextRecurrenceDate(recurrence: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const next = new Date()
  if (recurrence === 'daily') next.setDate(next.getDate() + 1)
  else if (recurrence === 'weekly') next.setDate(next.getDate() + 7)
  else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1)
  let hours = h - 5
  let mins = m - 30
  if (mins < 0) { mins += 60; hours-- }
  if (hours < 0) { hours += 24; next.setDate(next.getDate() - 1) }
  next.setHours(hours, mins, 0, 0)
  return next
}

/**
 * Validation des emails
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validation du titre de sondage
 */
export function validatePollTitle(title: string): boolean {
  const trimmedTitle = title.trim();
  return trimmedTitle.length > 0 && trimmedTitle.length <= 255;
}

/**
 * Validation d'une date au format YYYY-MM-DD
 */
export function isValidDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(Number);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

/**
 * Validation qu'une date est future
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDate(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date >= today;
}

/**
 * Validation d'une liste d'emails séparés par des virgules
 */
export function validateEmailList(emailList: string): { valid: string[]; invalid: string[] } {
  const emails = emailList.split(',').map(email => email.trim()).filter(email => email.length > 0);
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  emails.forEach(email => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });
  
  return { valid, invalid };
}

/**
 * Validation d'un créneau horaire (HH:MM format)
 */
export function validateTimeSlot(timeSlot: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeSlot);
}

/**
 * Validation qu'un créneau de fin est après le début
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!validateTimeSlot(startTime) || !validateTimeSlot(endTime)) {
    return false;
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes > startMinutes;
} 
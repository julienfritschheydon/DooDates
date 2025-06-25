#!/usr/bin/env node

// Script pour générer un calendrier statique de 10 ans
// À exécuter une seule fois : node scripts/generate-static-calendar.js
// Génère src/data/calendar-10years.json

const fs = require('fs');
const path = require('path');

function generateStaticCalendar() {
  console.log('🚀 Génération du calendrier statique 10 ans...');
  console.time('📅 Génération complète');
  
  const startYear = 2024;
  const endYear = 2034;
  const days = [];
  const byYear = {};
  const byMonth = {};
  const byDayOfWeek = {};
  const weekends = [];
  const weekdays = [];

  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                     'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // Jours fériés fixes français
  const fixedHolidays = [
    { month: 1, day: 1 },   // Jour de l'An
    { month: 5, day: 1 },   // Fête du Travail
    { month: 5, day: 8 },   // Victoire 1945
    { month: 7, day: 14 },  // Fête Nationale
    { month: 8, day: 15 },  // Assomption
    { month: 11, day: 1 },  // Toussaint
    { month: 11, day: 11 }, // Armistice
    { month: 12, day: 25 }  // Noël
  ];

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const isFixedHoliday = (month, day) => {
    return fixedHolidays.some(holiday => 
      holiday.month === month && holiday.day === day
    );
  };

  console.log(`📊 Génération de ${endYear - startYear + 1} années...`);

  for (let year = startYear; year <= endYear; year++) {
    console.log(`📅 Année ${year}...`);
    byYear[year] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      byMonth[monthKey] = [];
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        const weekNumber = getWeekNumber(date);
        const quarterNumber = Math.ceil((month + 1) / 3);
        const isHoliday = isFixedHoliday(month + 1, day);
        
        const calendarDay = {
          date: dateStr,
          year,
          month: month + 1,
          day,
          dayOfWeek,
          dayName: dayNames[dayOfWeek],
          monthName: monthNames[month],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isHoliday,
          weekNumber,
          quarterNumber
        };

        days.push(calendarDay);
        byYear[year].push(calendarDay);
        byMonth[monthKey].push(calendarDay);
        
        if (!byDayOfWeek[dayOfWeek]) {
          byDayOfWeek[dayOfWeek] = [];
        }
        byDayOfWeek[dayOfWeek].push(calendarDay);
        
        if (calendarDay.isWeekend) {
          weekends.push(calendarDay);
        } else {
          weekdays.push(calendarDay);
        }
      }
    }
  }

  const calendar = {
    generated: new Date().toISOString(),
    version: '1.0',
    startYear,
    endYear,
    totalDays: days.length,
    days,
    byYear,
    byMonth,
    byDayOfWeek,
    weekends,
    weekdays
  };

  console.timeEnd('📅 Génération complète');
  console.log(`✅ Calendrier généré: ${days.length} jours, ${weekends.length} week-ends, ${weekdays.length} jours ouvrables`);

  return calendar;
}

function saveCalendarToFile(calendar) {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const filePath = path.join(dataDir, 'calendar-10years.json');

  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Dossier src/data créé');
  }

  console.log('💾 Sauvegarde du fichier JSON...');
  console.time('💾 Écriture fichier');
  
  fs.writeFileSync(filePath, JSON.stringify(calendar, null, 2));
  
  console.timeEnd('💾 Écriture fichier');
  
  const stats = fs.statSync(filePath);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`✅ Fichier sauvegardé: ${filePath}`);
  console.log(`📊 Taille du fichier: ${fileSizeMB} MB`);
  console.log(`🎯 Import dans ton code: import calendar from '../data/calendar-10years.json'`);
}

// Exécution du script
try {
  const calendar = generateStaticCalendar();
  saveCalendarToFile(calendar);
  console.log('🎉 Calendrier statique généré avec succès !');
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur lors de la génération:', error);
  process.exit(1);
} 
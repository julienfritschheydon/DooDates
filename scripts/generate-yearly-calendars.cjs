#!/usr/bin/env node

// Script pour générer des calendriers par année
// À exécuter une seule fois : node scripts/generate-yearly-calendars.cjs
// Génère src/data/calendar-YYYY.json pour chaque année

const fs = require('fs');
const path = require('path');

function generateYearCalendar(year) {
  console.log(`📅 Génération de l'année ${year}...`);
  console.time(`⏱️ Année ${year}`);
  
  const days = [];
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

  const calendar = {
    generated: new Date().toISOString(),
    version: '2.0',
    year,
    totalDays: days.length,
    days,
    byMonth,
    byDayOfWeek,
    weekends,
    weekdays,
    // Métadonnées utiles
    isLeapYear: new Date(year, 1, 29).getDate() === 29,
    weekendsCount: weekends.length,
    weekdaysCount: weekdays.length
  };

  console.timeEnd(`⏱️ Année ${year}`);
  console.log(`✅ ${year}: ${days.length} jours, ${weekends.length} week-ends`);

  return calendar;
}

function saveYearCalendarToFile(calendar, year) {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const filePath = path.join(dataDir, `calendar-${year}.json`);

  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(calendar, null, 2));
  
  const stats = fs.statSync(filePath);
  const fileSizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`💾 ${year}: ${fileSizeKB} KB sauvegardé`);
  
  return filePath;
}

// Générer les années nécessaires
function generateYearlyCalendars() {
  console.log('🚀 Génération des calendriers par année...');
  console.time('📅 Génération totale');
  
  const currentYear = new Date().getFullYear();
  const startYear = currentYear;
  const endYear = currentYear + 5; // 5 ans d'avance
  
  const generatedFiles = [];
  let totalSize = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    const calendar = generateYearCalendar(year);
    const filePath = saveYearCalendarToFile(calendar, year);
    generatedFiles.push(filePath);
    
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  }
  
  console.timeEnd('📅 Génération totale');
  
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log(`\n🎉 Génération terminée !`);
  console.log(`📊 ${generatedFiles.length} fichiers générés`);
  console.log(`📦 Taille totale: ${totalSizeMB} MB`);
  console.log(`💡 Taille moyenne par année: ${(totalSize / generatedFiles.length / 1024).toFixed(1)} KB`);
  
  // Créer un index des années disponibles
  const indexPath = path.join(__dirname, '..', 'src', 'data', 'calendar-index.json');
  const index = {
    generated: new Date().toISOString(),
    version: '2.0',
    availableYears: Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i),
    startYear,
    endYear,
    totalFiles: generatedFiles.length
  };
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`📋 Index créé: calendar-index.json`);
}

// Exécution du script
try {
  generateYearlyCalendars();
  console.log('\n✅ Calendriers par année générés avec succès !');
  console.log('🎯 Utilisation: import calendar2024 from "../data/calendar-2024.json"');
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur lors de la génération:', error);
  process.exit(1);
} 
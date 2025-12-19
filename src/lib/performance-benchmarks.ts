export const PERFORMANCE_BENCHMARKS = {
  products: {
    dashboards: {
      loadMs: {
        date: 3000,
        form: 3000,
        availability: 3000,
        quizz: 3000,
      },
    },
  },
  dashboard: {
    loadMs: {
      conversations50: 3000,
      conversations200: 5000,
    },
    menus: {
      tagsOpenMs: 500,
      foldersOpenMs: 500,
    },
  },
} as const;

export type PerformanceBenchmarks = typeof PERFORMANCE_BENCHMARKS;

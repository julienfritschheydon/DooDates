/**
 * Tests pour les règles conditionnelles
 * Valide validator et evaluator
 */

// Couleurs console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// ==================== TESTS VALIDATOR ====================

function testCircularDependency() {
  log('\n📋 Test 1: Détection dépendances circulaires', 'blue');
  
  // Simuler hasCircularDependency
  const hasCircularDependency = (rules, questionId, visited = new Set()) => {
    if (visited.has(questionId)) return true;
    const dependentRules = rules.filter((r) => r.questionId === questionId);
    if (dependentRules.length === 0) return false;
    const newVisited = new Set(visited);
    newVisited.add(questionId);
    for (const rule of dependentRules) {
      if (hasCircularDependency(rules, rule.dependsOn, newVisited)) {
        return true;
      }
    }
    return false;
  };

  // Test 1.1: Pas de boucle
  const rules1 = [
    { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } }
  ];
  const result1 = hasCircularDependency(rules1, 'q2');
  log(`  Test 1.1: Pas de boucle → ${result1 ? '❌ FAIL' : '✅ PASS'}`, result1 ? 'red' : 'green');

  // Test 1.2: Boucle simple Q1 → Q2 → Q1
  const rules2 = [
    { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } },
    { questionId: 'q1', dependsOn: 'q2', showIf: { operator: 'equals', value: 'Non' } }
  ];
  const result2 = hasCircularDependency(rules2, 'q2');
  log(`  Test 1.2: Boucle Q1→Q2→Q1 → ${result2 ? '✅ PASS' : '❌ FAIL'}`, result2 ? 'green' : 'red');

  // Test 1.3: Boucle complexe Q1 → Q2 → Q3 → Q1
  const rules3 = [
    { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } },
    { questionId: 'q3', dependsOn: 'q2', showIf: { operator: 'equals', value: 'Oui' } },
    { questionId: 'q1', dependsOn: 'q3', showIf: { operator: 'equals', value: 'Oui' } }
  ];
  const result3 = hasCircularDependency(rules3, 'q1');
  log(`  Test 1.3: Boucle Q1→Q2→Q3→Q1 → ${result3 ? '✅ PASS' : '❌ FAIL'}`, result3 ? 'green' : 'red');

  return !result1 && result2 && result3;
}

function testDependsOnPrevious() {
  log('\n📋 Test 2: Validation ordre questions', 'blue');
  
  const dependsOnPreviousQuestion = (rules, questions, questionId) => {
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) return false;
    const rule = rules.find((r) => r.questionId === questionId);
    if (!rule) return true;
    const dependsOnIndex = questions.findIndex((q) => q.id === rule.dependsOn);
    if (dependsOnIndex === -1) return false;
    return dependsOnIndex < questionIndex;
  };

  const questions = [
    { id: 'q1', title: 'Question 1' },
    { id: 'q2', title: 'Question 2' },
    { id: 'q3', title: 'Question 3' }
  ];

  // Test 2.1: Q2 dépend de Q1 (valide)
  const rules1 = [{ questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } }];
  const result1 = dependsOnPreviousQuestion(rules1, questions, 'q2');
  log(`  Test 2.1: Q2 dépend Q1 (avant) → ${result1 ? '✅ PASS' : '❌ FAIL'}`, result1 ? 'green' : 'red');

  // Test 2.2: Q1 dépend de Q2 (invalide)
  const rules2 = [{ questionId: 'q1', dependsOn: 'q2', showIf: { operator: 'equals', value: 'Oui' } }];
  const result2 = dependsOnPreviousQuestion(rules2, questions, 'q1');
  log(`  Test 2.2: Q1 dépend Q2 (après) → ${!result2 ? '✅ PASS' : '❌ FAIL'}`, !result2 ? 'green' : 'red');

  // Test 2.3: Q3 dépend de Q1 (valide)
  const rules3 = [{ questionId: 'q3', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } }];
  const result3 = dependsOnPreviousQuestion(rules3, questions, 'q3');
  log(`  Test 2.3: Q3 dépend Q1 (avant) → ${result3 ? '✅ PASS' : '❌ FAIL'}`, result3 ? 'green' : 'red');

  return result1 && !result2 && result3;
}

// ==================== TESTS EVALUATOR ====================

function testEvaluateRule() {
  log('\n📋 Test 3: Évaluation règles', 'blue');
  
  const evaluateRule = (rule, answers) => {
    const answer = answers[rule.dependsOn];
    switch (rule.showIf.operator) {
      case "equals": {
        if (!rule.showIf.value) return false;
        const expectedValue = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
        if (Array.isArray(answer)) return answer.includes(expectedValue);
        return answer === expectedValue;
      }
      case "contains": {
        if (!rule.showIf.value) return false;
        const expectedValues = Array.isArray(rule.showIf.value) ? rule.showIf.value : [rule.showIf.value];
        if (Array.isArray(answer)) return expectedValues.some((val) => answer.includes(val));
        return expectedValues.includes(answer);
      }
      case "notEquals": {
        if (!rule.showIf.value) return false;
        const expectedValue = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
        if (Array.isArray(answer)) return !answer.includes(expectedValue);
        return answer !== expectedValue;
      }
      case "isEmpty": {
        if (!answer) return true;
        if (Array.isArray(answer)) return answer.length === 0;
        return answer === "";
      }
      case "isNotEmpty": {
        if (!answer) return false;
        if (Array.isArray(answer)) return answer.length > 0;
        return answer !== "";
      }
      default:
        return false;
    }
  };

  // Test 3.1: equals avec choix unique
  const rule1 = { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'equals', value: 'Oui' } };
  const result1a = evaluateRule(rule1, { q1: 'Oui' });
  const result1b = evaluateRule(rule1, { q1: 'Non' });
  log(`  Test 3.1a: equals "Oui" avec réponse "Oui" → ${result1a ? '✅ PASS' : '❌ FAIL'}`, result1a ? 'green' : 'red');
  log(`  Test 3.1b: equals "Oui" avec réponse "Non" → ${!result1b ? '✅ PASS' : '❌ FAIL'}`, !result1b ? 'green' : 'red');

  // Test 3.2: contains avec choix multiple
  const rule2 = { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'contains', value: 'Option A' } };
  const result2a = evaluateRule(rule2, { q1: ['Option A', 'Option B'] });
  const result2b = evaluateRule(rule2, { q1: ['Option B', 'Option C'] });
  log(`  Test 3.2a: contains "Option A" avec ["A","B"] → ${result2a ? '✅ PASS' : '❌ FAIL'}`, result2a ? 'green' : 'red');
  log(`  Test 3.2b: contains "Option A" avec ["B","C"] → ${!result2b ? '✅ PASS' : '❌ FAIL'}`, !result2b ? 'green' : 'red');

  // Test 3.3: notEquals
  const rule3 = { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'notEquals', value: 'Non' } };
  const result3a = evaluateRule(rule3, { q1: 'Oui' });
  const result3b = evaluateRule(rule3, { q1: 'Non' });
  log(`  Test 3.3a: notEquals "Non" avec "Oui" → ${result3a ? '✅ PASS' : '❌ FAIL'}`, result3a ? 'green' : 'red');
  log(`  Test 3.3b: notEquals "Non" avec "Non" → ${!result3b ? '✅ PASS' : '❌ FAIL'}`, !result3b ? 'green' : 'red');

  // Test 3.4: isEmpty
  const rule4 = { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'isEmpty' } };
  const result4a = evaluateRule(rule4, { q1: '' });
  const result4b = evaluateRule(rule4, { q1: 'Quelque chose' });
  const result4c = evaluateRule(rule4, {});
  log(`  Test 3.4a: isEmpty avec "" → ${result4a ? '✅ PASS' : '❌ FAIL'}`, result4a ? 'green' : 'red');
  log(`  Test 3.4b: isEmpty avec "text" → ${!result4b ? '✅ PASS' : '❌ FAIL'}`, !result4b ? 'green' : 'red');
  log(`  Test 3.4c: isEmpty sans réponse → ${result4c ? '✅ PASS' : '❌ FAIL'}`, result4c ? 'green' : 'red');

  // Test 3.5: isNotEmpty
  const rule5 = { questionId: 'q2', dependsOn: 'q1', showIf: { operator: 'isNotEmpty' } };
  const result5a = evaluateRule(rule5, { q1: 'Quelque chose' });
  const result5b = evaluateRule(rule5, { q1: '' });
  log(`  Test 3.5a: isNotEmpty avec "text" → ${result5a ? '✅ PASS' : '❌ FAIL'}`, result5a ? 'green' : 'red');
  log(`  Test 3.5b: isNotEmpty avec "" → ${!result5b ? '✅ PASS' : '❌ FAIL'}`, !result5b ? 'green' : 'red');

  return result1a && !result1b && result2a && !result2b && result3a && !result3b && result4a && !result4b && result4c && result5a && !result5b;
}

function testShouldShowQuestion() {
  log('\n📋 Test 4: Visibilité questions', 'blue');
  
  const evaluateRule = (rule, answers) => {
    const answer = answers[rule.dependsOn];
    switch (rule.showIf.operator) {
      case "equals": {
        if (!rule.showIf.value) return false;
        const expectedValue = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
        if (Array.isArray(answer)) return answer.includes(expectedValue);
        return answer === expectedValue;
      }
      default:
        return false;
    }
  };

  const shouldShowQuestion = (questionId, rules, answers) => {
    const questionRules = rules.filter((r) => r.questionId === questionId);
    if (questionRules.length === 0) return true;
    return questionRules.every((rule) => evaluateRule(rule, answers));
  };

  const rules = [
    { questionId: 'q3bis', dependsOn: 'q3', showIf: { operator: 'equals', value: 'Non' } }
  ];

  // Test 4.1: Question sans règle (toujours visible)
  const result1 = shouldShowQuestion('q1', rules, {});
  log(`  Test 4.1: Question sans règle → ${result1 ? '✅ PASS' : '❌ FAIL'}`, result1 ? 'green' : 'red');

  // Test 4.2: Q3bis visible si Q3 = "Non"
  const result2a = shouldShowQuestion('q3bis', rules, { q3: 'Non' });
  const result2b = shouldShowQuestion('q3bis', rules, { q3: 'Oui' });
  log(`  Test 4.2a: Q3bis avec Q3="Non" → ${result2a ? '✅ PASS' : '❌ FAIL'}`, result2a ? 'green' : 'red');
  log(`  Test 4.2b: Q3bis avec Q3="Oui" → ${!result2b ? '✅ PASS' : '❌ FAIL'}`, !result2b ? 'green' : 'red');

  // Test 4.3: Q3bis invisible si Q3 pas répondu
  const result3 = shouldShowQuestion('q3bis', rules, {});
  log(`  Test 4.3: Q3bis sans réponse Q3 → ${!result3 ? '✅ PASS' : '❌ FAIL'}`, !result3 ? 'green' : 'red');

  return result1 && result2a && !result2b && !result3;
}

function testCaseCrews() {
  log('\n📋 Test 5: Cas réel questionnaire Crews', 'blue');
  
  const evaluateRule = (rule, answers) => {
    const answer = answers[rule.dependsOn];
    if (rule.showIf.operator === "equals") {
      if (!rule.showIf.value) return false;
      const expectedValue = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
      if (Array.isArray(answer)) return answer.includes(expectedValue);
      return answer === expectedValue;
    }
    return false;
  };

  const shouldShowQuestion = (questionId, rules, answers) => {
    const questionRules = rules.filter((r) => r.questionId === questionId);
    if (questionRules.length === 0) return true;
    return questionRules.every((rule) => evaluateRule(rule, answers));
  };

  // Questionnaire Crews réel
  const rules = [
    {
      questionId: 'q3bis',
      dependsOn: 'q3',
      showIf: { operator: 'equals', value: 'Non, pas vraiment' }
    }
  ];

  log('  Scénario: Q3bis affiché si Q3 = "Non, pas vraiment"');

  // Cas 1: User répond "Non, pas vraiment"
  const answers1 = { q3: 'Non, pas vraiment' };
  const result1 = shouldShowQuestion('q3bis', rules, answers1);
  log(`  Test 5.1: Q3="Non, pas vraiment" → Q3bis visible → ${result1 ? '✅ PASS' : '❌ FAIL'}`, result1 ? 'green' : 'red');

  // Cas 2: User répond "Oui, très bien équilibré"
  const answers2 = { q3: 'Oui, très bien équilibré' };
  const result2 = shouldShowQuestion('q3bis', rules, answers2);
  log(`  Test 5.2: Q3="Oui, très bien..." → Q3bis masqué → ${!result2 ? '✅ PASS' : '❌ FAIL'}`, !result2 ? 'green' : 'red');

  // Cas 3: User répond "Moyennement"
  const answers3 = { q3: 'Moyennement' };
  const result3 = shouldShowQuestion('q3bis', rules, answers3);
  log(`  Test 5.3: Q3="Moyennement" → Q3bis masqué → ${!result3 ? '✅ PASS' : '❌ FAIL'}`, !result3 ? 'green' : 'red');

  return result1 && !result2 && !result3;
}

// ==================== EXÉCUTION TESTS ====================

console.log('\n' + '='.repeat(80));
log('🧪 TESTS RÈGLES CONDITIONNELLES', 'bold');
console.log('='.repeat(80));

const test1 = testCircularDependency();
const test2 = testDependsOnPrevious();
const test3 = testEvaluateRule();
const test4 = testShouldShowQuestion();
const test5 = testCaseCrews();

console.log('\n' + '='.repeat(80));
log('📊 RÉSULTATS FINAUX', 'bold');
console.log('='.repeat(80));

log(`Test 1 - Dépendances circulaires: ${test1 ? '✅ PASS' : '❌ FAIL'}`, test1 ? 'green' : 'red');
log(`Test 2 - Ordre questions: ${test2 ? '✅ PASS' : '❌ FAIL'}`, test2 ? 'green' : 'red');
log(`Test 3 - Évaluation règles: ${test3 ? '✅ PASS' : '❌ FAIL'}`, test3 ? 'green' : 'red');
log(`Test 4 - Visibilité questions: ${test4 ? '✅ PASS' : '❌ FAIL'}`, test4 ? 'green' : 'red');
log(`Test 5 - Cas réel Crews: ${test5 ? '✅ PASS' : '❌ FAIL'}`, test5 ? 'green' : 'red');

const allPassed = test1 && test2 && test3 && test4 && test5;
console.log('\n' + '='.repeat(80));
if (allPassed) {
  log('✅ TOUS LES TESTS RÉUSSIS !', 'green');
} else {
  log('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
}
console.log('='.repeat(80) + '\n');

process.exit(allPassed ? 0 : 1);

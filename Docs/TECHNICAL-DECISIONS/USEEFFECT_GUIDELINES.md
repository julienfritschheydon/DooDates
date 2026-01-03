# useEffect Guidelines - DooDates

## 📋 Standards pour les patterns useEffect

### 🎯 **Règles générales**

1. **Dépendances explicites** : Toujours spécifier toutes les dépendances
2. **Cleanup systématique** : Nettoyer les timers, listeners, subscriptions
3. **Conditions de garde** : Vérifier les conditions avant exécution
4. **Séparation des responsabilités** : Un useEffect = une responsabilité

### ✅ **Patterns recommandés**

#### 1. **Initialisation avec cleanup**

```typescript
useEffect(() => {
  let isMounted = true;

  const initialize = async () => {
    try {
      const data = await fetchData();
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };

  initialize();

  return () => {
    isMounted = false;
  };
}, []);
```

#### 2. **Listeners avec cleanup**

```typescript
useEffect(() => {
  const handleResize = () => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

#### 3. **Timers avec cleanup**

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setShowMessage(false);
  }, 3000);

  return () => {
    clearTimeout(timer);
  };
}, [showMessage]);
```

#### 4. **Conditions de garde**

```typescript
useEffect(() => {
  if (!user || !data) return;

  const processData = async () => {
    try {
      await processUserData(user, data);
    } catch (error) {
      console.error("Processing failed:", error);
    }
  };

  processData();
}, [user, data]);
```

#### 5. **Dépendances avec useCallback**

```typescript
const fetchData = useCallback(async () => {
  if (!id) return;

  try {
    setLoading(true);
    const result = await api.getData(id);
    setData(result);
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
}, [id]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### ❌ **Anti-patterns à éviter**

#### 1. **Dépendances manquantes**

```typescript
// ❌ Mauvais
useEffect(() => {
  setData(processData(user));
}, []); // user manquant dans les dépendances

// ✅ Correct
useEffect(() => {
  setData(processData(user));
}, [user]);
```

#### 2. **Pas de cleanup**

```typescript
// ❌ Mauvais
useEffect(() => {
  const timer = setInterval(() => {
    fetchUpdates();
  }, 1000);
}, []);

// ✅ Correct
useEffect(() => {
  const timer = setInterval(() => {
    fetchUpdates();
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

#### 3. **useEffect trop complexe**

```typescript
// ❌ Mauvais - trop de responsabilités
useEffect(() => {
  fetchUser();
  setupWebSocket();
  trackAnalytics();
  validateForm();
}, []);

// ✅ Correct - séparé
useEffect(() => {
  fetchUser();
}, []);
useEffect(() => {
  setupWebSocket();
}, []);
useEffect(() => {
  trackAnalytics();
}, []);
useEffect(() => {
  validateForm();
}, []);
```

### 🔧 **Patterns spécifiques DooDates**

#### 1. **Storage operations**

```typescript
useEffect(() => {
  const saveToStorage = async () => {
    try {
      await storage.save(data);
    } catch (error) {
      console.error("Storage save failed:", error);
    }
  };

  if (data) {
    saveToStorage();
  }
}, [data, storage]);
```

#### 2. **Conversation management**

```typescript
useEffect(() => {
  if (!conversationId) return;

  let isMounted = true;

  const loadConversation = async () => {
    try {
      const conversation = await conversationStorage.getConversation(conversationId);
      if (isMounted && conversation) {
        setMessages(conversation.messages);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };

  loadConversation();

  return () => {
    isMounted = false;
  };
}, [conversationId, conversationStorage]);
```

#### 3. **Auto-save with debounce**

```typescript
useEffect(() => {
  if (!isDirty) return;

  const timer = setTimeout(async () => {
    try {
      await autoSave.save();
      setIsDirty(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, 1000);

  return () => clearTimeout(timer);
}, [isDirty, autoSave]);
```

### 🚀 **Optimisations**

#### 1. **Memoization des dépendances**

```typescript
const config = useMemo(
  () => ({
    apiKey: process.env.API_KEY,
    timeout: 5000,
  }),
  [],
);

useEffect(() => {
  initializeService(config);
}, [config]);
```

#### 2. **Conditional effects**

```typescript
useEffect(() => {
  if (!shouldRun) return;

  const cleanup = setupFeature();
  return cleanup;
}, [shouldRun, dependency]);
```

### 📊 **Debugging useEffect**

#### 1. **Logging des dépendances**

```typescript
useEffect(() => {
  console.log("Effect triggered with:", { user, data, timestamp: Date.now() });

  // Effect logic here
}, [user, data]);
```

#### 2. **Tracking des re-renders**

```typescript
const renderCount = useRef(0);
renderCount.current++;

useEffect(() => {
  console.log(`Effect run #${renderCount.current}`);
}, [dependency]);
```

### 🎯 **Checklist useEffect**

- [ ] Toutes les dépendances sont listées
- [ ] Cleanup implémenté si nécessaire
- [ ] Conditions de garde ajoutées
- [ ] Gestion d'erreurs présente
- [ ] Pas de side effects synchrones
- [ ] Performance optimisée (useMemo/useCallback)
- [ ] Logs de debug ajoutés si complexe

# 📱 Test Mobile en Local (GRATUIT)

## ✅ Méthode 1 : Réseau local (2 min)

**La plus simple et rapide !**

### Étape 1 : Lance le serveur

```bash
npm run dev
```

### Étape 2 : Récupère l'URL réseau

Le terminal affiche :

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:8080/
➜  Network: http://192.168.1.42:8080/  ← COPIE CETTE URL
```

### Étape 3 : Ouvre sur ton mobile

1. **Connecte ton téléphone au même WiFi** que ton PC
2. Ouvre le navigateur mobile (Chrome/Safari)
3. Tape l'URL : `http://192.168.1.X:8080/`

**C'est tout ! Ça marche instantanément** 🎉

### Avantages

- ✅ Gratuit
- ✅ Instantané (pas de build)
- ✅ Hot reload (modifications en temps réel)
- ✅ Pas besoin d'internet
- ✅ Pas besoin de compte

---

## 🌐 Méthode 2 : ngrok (si WiFi différent)

Si ton téléphone n'est pas sur le même WiFi que ton PC.

### Installation

```bash
# Windows (avec Chocolatey)
choco install ngrok

# Ou télécharger : https://ngrok.com/download
```

### Utilisation

```bash
# Terminal 1 : Lance le serveur
npm run dev

# Terminal 2 : Lance ngrok
ngrok http 8080
```

### Résultat

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8080
            ↑ Cette URL fonctionne de n'importe où !
```

**Copie l'URL `https://abc123.ngrok-free.app` et ouvre-la sur ton mobile**

### Avantages

- ✅ Fonctionne même en 4G/5G
- ✅ Partage avec d'autres personnes
- ✅ HTTPS automatique
- ✅ Hot reload fonctionne

---

## 🔍 Méthode 3 : Chrome DevTools (pas besoin de téléphone)

Si tu veux juste tester rapidement sans téléphone :

1. Ouvre Chrome DevTools (`F12`)
2. Active le mode device (`Ctrl + Shift + M`)
3. Choisis "iPhone SE" ou autre
4. Teste toutes les interactions

**Mais c'est moins précis qu'un vrai téléphone !**

---

## 🛠️ Troubleshooting

### L'URL Network n'apparaît pas

**Vérifier que `host: true` est dans `vite.config.ts` :**

```typescript
server: {
  host: true,  // ← Doit être là
  port: 8080,
}
```

**Relancer le serveur :**

```bash
Ctrl+C
npm run dev
```

### Le mobile ne charge pas

**Vérifier le WiFi :**

- PC et mobile sur le **même réseau WiFi**
- Pas de VPN actif
- Pare-feu Windows autorise le port 8080

**Autoriser le port dans le pare-feu :**

```powershell
# PowerShell en admin
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### Erreur "Cannot GET /"

**Vérifier que le serveur tourne :**

```bash
# Doit afficher "ready in XXX ms"
npm run dev
```

**Vérifier l'URL :**

- Utiliser `http://` (pas `https://`)
- Utiliser l'IP affichée (pas localhost)
- Utiliser le bon port (8080)

---

## 📊 Comparaison des méthodes

| Méthode             | Vitesse       | Gratuit | Hot Reload | 4G/5G |
| ------------------- | ------------- | ------- | ---------- | ----- |
| **Réseau local**    | ⚡ Instantané | ✅      | ✅         | ❌    |
| **ngrok**           | 🚀 Rapide     | ✅      | ✅         | ✅    |
| **GitHub Pages**    | 🐌 2-3 min    | ✅      | ❌         | ✅    |
| **Chrome DevTools** | ⚡ Instantané | ✅      | ✅         | N/A   |

**Recommandation : Réseau local** (le plus simple et rapide)

---

## 🎯 Ce que tu peux tester

Une fois sur mobile :

### Navigation

- [ ] Hamburger ouvre/ferme sidebar
- [ ] Backdrop ferme sidebar
- [ ] Scroll vertical fonctionne
- [ ] Toggle Chat ↔ Preview

### Interactions tactiles

- [ ] Tap sur boutons
- [ ] Swipe pour scroll
- [ ] Pinch to zoom (désactivé normalement)
- [ ] Double tap

### Performance

- [ ] Chargement rapide
- [ ] Animations fluides
- [ ] Pas de lag au scroll
- [ ] Hot reload fonctionne

### Responsive

- [ ] Texte lisible
- [ ] Boutons cliquables
- [ ] Pas de débordement horizontal
- [ ] Layout adapté à la taille

---

## 💡 Astuce Pro

**Ajouter un raccourci sur l'écran d'accueil :**

1. Ouvre l'URL sur mobile
2. Menu navigateur → "Ajouter à l'écran d'accueil"
3. L'app s'ouvre comme une app native !

**Ça fonctionne même en local** (tant que le serveur tourne)

---

## 🚀 Workflow recommandé

```bash
# 1. Lance le serveur
npm run dev

# 2. Note l'URL Network
# Exemple : http://192.168.1.42:8080/

# 3. Ouvre sur mobile
# Même WiFi → Tape l'URL

# 4. Développe et teste
# Les changements apparaissent en temps réel !

# 5. Quand c'est bon
# Commit et push (optionnel : déployer sur GitHub Pages)
```

**Pas besoin de GitHub Pages pour tester !** 🎉

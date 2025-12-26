
# 🚀 Ghid Deploy TradeGoggles Live

Acest document te ajută să pui aplicația ta de trading journal pe internet, accesibilă de oriunde.

## 🛠️ Rezolvare Eroare: "src refspec main does not match any"

Dacă primești această eroare la `git push`, urmează acești pași:

1.  **Verifică statusul**: `git status`. Dacă vezi fișiere cu roșu, rulează `git add .`.
2.  **Configurează identitatea (dacă e prima dată)**:
    *   `git config --global user.email "emailul-tau@exemplu.com"`
    *   `git config --global user.name "Numele Tau"`
3.  **Fă commit-ul**: `git commit -m "Initial commit"`
4.  **Redenumește și urcă**: 
    *   `git branch -M main`
    *   `git push -u origin main`

## Opțiunea 1: Vercel (Recomandat)

Vercel este cea mai rapidă metodă de a pune o aplicație React online.

1.  **Creează un cont**: Mergi pe [vercel.com](https://vercel.com) și loghează-te (recomandat cu GitHub).
2.  **Încarcă codul**: Importă repository-ul `TradeGoggles`.
3.  **Configurare Environment Variables**:
    *   În **Settings** -> **Environment Variables**, adaugă `API_KEY` cu cheia ta Gemini.
4.  **Deploy**: Apasă pe butonul Deploy.

## ⚠️ Notă importantă despre date
Aplicația folosește în prezent `localStorage`. Datele sunt salvate **doar în browser-ul de pe care accesezi site-ul**. Dacă dorești sincronizare între dispozitive, va trebui să integrăm o bază de date precum Supabase.

## Funcționalități incluse:
*   **AI Coach**: Analize automate pentru fiecare trade folosind Gemini.
*   **Apex Tracker**: Monitorizare drawdown în timp real (Trailing Drawdown & PA rules).
*   **Journal**: Notițe zilnice și calendar de performanță navigabil.

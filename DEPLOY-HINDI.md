# Gokul Fresh — Live URL kaise mile (deploy)

Main agent aapke **Render / Netlify account mein login nahi kar sakta** — isliye final **Deploy** button aapko dabana hoga. Neeche seedha order hai: pehle database, phir API, phir website.

---

## 0. Pehle GitHub par code

1. [GitHub](https://github.com) par naya repository banao (khali).
2. Computer par project folder mein:

```powershell
cd "c:\Users\LENOVO\OneDrive\Desktop\Dairy app"
git init
git add .
git commit -m "Gokul Fresh app"
git branch -M main
git remote add origin https://github.com/AAPKA-USER/AAPKA-REPO.git
git push -u origin main
```

(`AAPKA-USER/AAPKA-REPO` apni repo se replace karo.)

---

## 1. MongoDB Atlas (free)

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → free cluster banao.
2. **Database Access** → user + password.
3. **Network Access** → `0.0.0.0/0` (sab IPs — production mein baad mein tighten kar sakte ho).
4. **Connect** → app → connection string copy karo:

```
mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/gokul_fresh?retryWrites=true&w=majority
```

---

## 2. Backend — Render (free tier)

1. [dashboard.render.com](https://dashboard.render.com) → Sign up (GitHub se easy).
2. **New** → **Blueprint** (ya **Web Service**).
3. Repo connect karo.
4. Agar **Web Service** manual:
   - **Root Directory:** `dairy-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
5. **Environment** → ye variables daalo (values apne):

| Name | Value |
|------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas wala pura string |
| `JWT_SECRET` | lambha random string (30+ characters) |
| `UPI_ID` | apna UPI id |
| `RAZORPAY_KEY_ID` | `rzp_live_...` (live mode) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `SMTP_USER`, `SMTP_PASS`, `SENDER_EMAIL` | OTP email ke liye (optional but recommended) |

6. **Create Web Service** → 5–10 min baad **URL** milega, jaise:

```
https://gokul-fresh-api-xxxx.onrender.com
```

7. Browser mein check:  
   `https://WOH-URL/api/health` → `{"ok":true,...}` aana chahiye.

**Ye API URL note kar lo** — frontend ko iski zaroorat hai.

---

## 3. Frontend — Netlify (free)

1. [app.netlify.com](https://app.netlify.com) → Sign up.
2. **Add new site** → **Import existing project** → GitHub repo.
3. Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build` (ya Base = frontend ho to sirf `build`)
4. **Environment variables** → Add:

| Name | Value |
|------|--------|
| `REACT_APP_API_URL` | `https://gokul-fresh-api-xxxx.onrender.com/api` |
| `REACT_APP_RAZORPAY_KEY_ID` | apni `rzp_live_...` key (sirf Key ID) |

5. **Deploy site** → Netlify URL milega, jaise:

```
https://random-name-123.netlify.app
```

Netlify project **Site settings → Domain management** se naam short kar sakte ho (`gokulfresh.netlify.app` jaisa).

---

## 4. Razorpay (live)

- Dashboard **Live mode** → Keys backend + `REACT_APP_RAZORPAY_KEY_ID` dono mein same live Key ID.
- **Allowed** domains / webhook: Razorpay docs ke hisaab se apna Netlify domain allow karo jab wo option ho.

---

## 5. Baad mein (admin / products)

SSH / Render shell se nahi chalaoge to **local** se admin banake bhi chalega jab `MONGODB_URI` same ho:

```powershell
cd "c:\Users\LENOVO\OneDrive\Desktop\Dairy app\dairy-backend"
# .env mein wahi MONGODB_URI jo Atlas par hai
node scripts/makeAdmin.js aapka@email.com
```

Phir live site par login → Admin.

---

## Tumhe kya milega?

| Cheez | URL example |
|--------|--------------|
| **Website (customers)** | `https://xxx.netlify.app` |
| **API** | `https://xxx.onrender.com` |

**Main tumhe abhi ek ready URL nahi de sakta** kyunki wo tab banta hai jab **tum** Render/Netlify par deploy karte ho. Upar wale steps follow karte hi tumhara apna URL ban jayega.

Repo mein `render.yaml` + `frontend/netlify.toml` + `frontend/vercel.json` add hain — agar **Blueprint** / import use karte ho to assist karenge.

---

## Vercel use karna ho (frontend)

1. [vercel.com](https://vercel.com) → New Project → same GitHub repo.
2. **Root Directory:** `frontend`
3. Env: `REACT_APP_API_URL`, `REACT_APP_RAZORPAY_KEY_ID`
4. Deploy → `xxx.vercel.app` milega.

`vercel.json` SPA routing ke liye `frontend/` mein hai.

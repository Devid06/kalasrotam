# Going live — the whole setup, in order

Three things, roughly an hour in total:

1. **Supabase** — the database behind instant editing (~20 min)
2. **Cloudflare** — where the site lives (~10 min)
3. **The GoDaddy domain** — pointing it at the site (~15 min + waiting)

Do them in this order. Each one needs something from the one before.

---

## 1. Supabase

> Make this account with **Divyansh's email**. It holds his customers' phone
> numbers and his website's content — it should be in his name, not yours. Add
> yourself as a member afterwards if you need access.

### 1.1 Create the project

1. Go to **[supabase.com](https://supabase.com)** → Start your project → sign up
2. **New project**
   - Name: `kalasrotam`
   - Database password: generate one and **save it somewhere safe** — it cannot
     be recovered, only reset
   - Region: **South Asia (Mumbai)** — closest to the buyers
3. Wait ~2 minutes while it builds

### 1.2 Create the tables

1. Left sidebar → **SQL Editor** → **New query**
2. Open [`supabase/setup.sql`](supabase/setup.sql) from this repo, copy **all**
   of it, paste it in
3. Press **Run**

It builds the content row, the enquiries table, and the artwork storage bucket,
and sets the security rules. It is safe to run more than once.

### 1.3 Create the logins

1. **Authentication** → **Users** → **Add user** → *Create new user*
2. Add Divyansh's email and a password. Tick **Auto Confirm User**.
3. Repeat for your own email.
4. **Authentication** → **Sign In / Providers** → **Email** → turn **off**
   *Allow new users to sign up*

That last step matters. Without it, anyone could create themselves an account
and edit the site.

### 1.4 Copy the two keys

**Project Settings** → **API**. You need:

| Field | Goes into |
| --- | --- |
| **Project URL** | `VITE_SUPABASE_URL` |
| **anon** / **public** key | `VITE_SUPABASE_ANON_KEY` |

> **Never copy the `service_role` key into this project.** It bypasses every
> security rule. The `anon` key is the one that is safe to publish — the site's
> protection comes from the rules in `setup.sql`, not from hiding it.

### 1.5 Test it locally first

Create a file called `.env.local` in the project folder:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Then `npm run dev`, open `http://localhost:5173/?admin=1`, sign in, change
something, press **Publish**. Reload — the change should still be there.

`.env.local` is git-ignored. Those keys never enter the repository.

---

## 2. Cloudflare

Cloudflare has two ways to host a static site — **Workers** and **Pages**. Both
are free with unlimited bandwidth. Cloudflare now steers new projects toward
Workers, and the dashboard hides Pages, so Workers is what you will most likely
land on. Either is fine; this project is deployed on **Workers**.

1. **[dash.cloudflare.com](https://dash.cloudflare.com)** — sign up free, using
   Divyansh's email
2. **Workers & Pages** → **Create** → **Import a repository**
3. Authorise GitHub and pick **Devid06/kalasrotam**

   > When GitHub asks which repositories to share, choose **Only select
   > repositories → kalasrotam**. "All repositories" would hand Cloudflare read
   > access to every other project in that account.

4. Build settings — Cloudflare detects Vite and fills most of this in:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` (leave as offered) |
   | Path | `/` |

5. **API token** — leave it on *Create new token*. Cloudflare makes one itself;
   you do not need to configure anything.

6. **Variables** — add both, and do it **now**:

   ```
   VITE_SUPABASE_URL       = https://xxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJhbGciOi...
   ```

   Vite bakes these into the JavaScript **at build time**. Adding them after the
   first build does nothing until you deploy again. If the live site ever shows
   the original placeholder text, or the editor says "Not connected to the
   database", this is why — fix the variables and redeploy.

7. **Deploy**

### The two URLs you get

```
https://kalasrotam.<subdomain>.workers.dev              ← production, share this
https://<version-id>-kalasrotam.<subdomain>.workers.dev ← one per deployment
```

The prefixed one is a **version preview**, and its address changes with every
push. Always give people the clean one.

Every push to `main` redeploys automatically from here on.

## 3. The GoDaddy domain

### 3.1 Add it in Cloudflare

1. Open the Worker → **Settings** → **Domains & Routes** → **Add** →
   **Custom domain**
2. Type the domain (e.g. `www.kalasrotam.com`) → **Add domain**
3. Cloudflare shows you the DNS records it wants

   If the domain's nameservers are already on Cloudflare (see below), it adds
   the records itself and there is nothing to copy.

### 3.2 Point GoDaddy at it

**The simple way — one record:**

1. GoDaddy → **My Products** → find the domain → **DNS** → **Manage Zones**
2. **Add** a record:

   | Field | Value |
   | --- | --- |
   | Type | `CNAME` |
   | Name | `www` |
   | Value | `kalasrotam.<subdomain>.workers.dev` (whatever Cloudflare showed) |
   | TTL | 1 hour |

3. For the bare domain (`kalasrotam.com` with no `www`), GoDaddy does not
   support CNAME on the root. Add Cloudflare's **A record** instead — it gives
   you the IP addresses on the same screen.
4. Back in GoDaddy, **Forwarding** → forward `kalasrotam.com` → `www.kalasrotam.com`

**The better way — move the nameservers:**

Cloudflare will offer to manage the whole domain. Take it if you can: the root
domain then works without forwarding, DNS is faster, and everything lives in one
dashboard.

1. Cloudflare → **Add a site** → enter the domain → Free plan
2. It gives you two nameservers, e.g. `alice.ns.cloudflare.com`
3. GoDaddy → domain → **Nameservers** → **Change** → **I'll use my own**
4. Paste both, save

Takes 15 minutes to a few hours to take effect. HTTPS is automatic either way.

### 3.3 After it works

Add the domain to Supabase so logins keep working:
**Authentication** → **URL Configuration** → set **Site URL** to
`https://www.kalasrotam.com`.

---

## Everyday use, once it is running

**Divyansh edits at `https://www.kalasrotam.com/?admin=1`**

1. Sign in with his email and password
2. Change any text, price or photo — the page updates as he types
3. Press **Publish** — live for everyone in about a second

No files, no uploads, no waiting for a rebuild.

**Why there is still a Publish button:** edits preview privately until he presses
it. Saving every keystroke straight to a live site would show half-typed
headlines to whoever is reading the page at that moment.

**Photos** upload straight to storage. They are resized in the browser first, so
a 6MB phone photo does not become a 6MB download for every visitor.

**Enquiries** land in the **Leads** tab — name, phone, email, budget, message —
with a WhatsApp link beside each and a CSV export.

**Backup / Restore** are still there. Backup downloads everything as one file;
Restore loads it back. Worth doing before any big change.

---

## Free tier limits

| | Free allowance | This site will use |
| --- | --- | --- |
| Supabase database | 500 MB | well under 1 MB |
| Supabase storage | 1 GB | ~200 photos |
| Supabase bandwidth | 5 GB/month | fine unless it goes viral |
| Cloudflare Workers | unlimited bandwidth | — |
| Cloudflare builds | 500/month | one per push |

One thing to know: **a free Supabase project pauses after about a week with no
activity.** A live site with visitors keeps it awake. If Divyansh takes a long
break, the first load afterwards may need a nudge from the Supabase dashboard.

---

## If something breaks

**The site loads but edits are missing** — the database was unreachable, so it
fell back to the last published copy. Check the Supabase project is not paused.

**"Could not publish"** — the session expired. Sign out and back in.

**Photos will not upload** — `setup.sql` was not run, or not fully. Run it again;
it is safe to repeat.

**Everything shows the original placeholder text** — the environment variables
are missing in Cloudflare, or were added after the build. Retry the deployment.

The site is built so none of these take it down. If the database is unreachable
it renders the last published content, and if that is missing too it falls back
to the defaults in `src/data/site.js`. Visitors see a working website either way.

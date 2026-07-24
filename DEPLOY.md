# Deploy Amoechat ke CloudPanel melalui GitHub Actions

Workflow berada di `.github/workflows/deploy.yml`. Build dilakukan di GitHub
Actions agar CPU dan RAM server CloudPanel tetap ringan. Server hanya menerima
hasil standalone, mengaktifkan rilis, dan menjalankan Next.js dengan PM2 sebagai
SSH site user. Seluruh proses tidak memakai `root` atau `sudo`.

Cloudflare tetap menjadi proxy DNS/HTTPS di depan origin CloudPanel. Aplikasi
Next.js ini tidak dijalankan di Cloudflare Pages atau Workers karena memakai
runtime Node.js, Prisma, MySQL, filesystem media, dan Sharp.

## 1. Siapkan Node.js Site di CloudPanel

Di CloudPanel:

1. Buat atau buka Node.js Site untuk `blog.amoechat.com`.
2. Pilih Node.js 22.
3. Isi App Port `3010`.
4. Catat **Site User**. User inilah yang dipakai SSH, bukan root.
5. Buka **Settings → Site User Settings → SSH Keys**.

Root Directory tidak perlu diarahkan langsung ke folder rilis. Nginx CloudPanel
cukup meneruskan trafik ke App Port yang sama dengan variable `APP_PORT`.

## 2. Buat SSH key khusus deploy

Jalankan di komputer sendiri:

```powershell
ssh-keygen -t ed25519 -C "github-actions-blog-amoechat" -f "$env:USERPROFILE\.ssh\blog_amoechat_deploy"
```

Saat ditanya passphrase, kosongkan karena key ini dipakai noninteraktif oleh
GitHub Actions. Hasilnya:

- `blog_amoechat_deploy.pub`: public key, aman ditempel ke CloudPanel.
- `blog_amoechat_deploy`: private key, hanya dimasukkan ke GitHub Secret.

Buka file public key:

```powershell
Get-Content "$env:USERPROFILE\.ssh\blog_amoechat_deploy.pub"
```

Salin satu baris tersebut ke **CloudPanel → Site → Settings → Site User
Settings → SSH Keys → Add SSH Key**.

## 3. Uji SSH dan ambil host key

Uji dari komputer sendiri:

```powershell
ssh -i "$env:USERPROFILE\.ssh\blog_amoechat_deploy" SITE_USER@IP_SERVER
```

Terima fingerprint hanya setelah IP/fingerprint cocok dengan server CloudPanel.
Setelah koneksi berhasil, keluar dengan `exit`.

Ambil entri host yang sudah dipercaya:

```powershell
ssh-keyscan -p 22 -H IP_SERVER
```

Simpan seluruh output `ssh-keyscan` sebagai secret `SSH_KNOWN_HOSTS`. Jika SSH
CloudPanel memakai port selain 22, ganti angka port pada kedua perintah.

## 4. Tambahkan GitHub Actions Secrets

Buka repository:

`Settings → Secrets and variables → Actions → Secrets → New repository secret`

Tambahkan:

| Secret | Isi |
| --- | --- |
| `SSH_HOST` | IP atau hostname origin CloudPanel |
| `SSH_PORT` | Port SSH, biasanya `22` |
| `SSH_USER` | Site User dari CloudPanel |
| `SSH_PRIVATE_KEY` | Seluruh isi file private key `blog_amoechat_deploy` |
| `SSH_KNOWN_HOSTS` | Output `ssh-keyscan` yang sudah diverifikasi |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Key stabil yang sama dengan `.env.production` server |

Tampilkan private key untuk disalin ke GitHub:

```powershell
Get-Content -Raw "$env:USERPROFILE\.ssh\blog_amoechat_deploy"
```

Jangan memasukkan `.env.production`, password database, atau password dashboard
ke repository.

## 5. Tambahkan GitHub Actions Variables

Di halaman yang sama pilih **Variables → New repository variable**:

| Variable | Contoh isi |
| --- | --- |
| `SITE_DOMAIN` | `blog.amoechat.com` |
| `APP_PORT` | `3010` |
| `PM2_APP_NAME` | `amoechat` |
| `NEXT_PUBLIC_SITE_URL` | `https://blog.amoechat.com` |
| `HEALTHCHECK_URL` | `https://blog.amoechat.com` |

Path deploy tidak perlu diisi. Workflow otomatis memakai:

```text
$HOME/htdocs/$SITE_DOMAIN
```

Untuk konfigurasi ini hasilnya adalah
`/home/amoechat-blog/htdocs/blog.amoechat.com`. Workflow tetap menolak path di
luar home milik Site User.

## 6. Buat environment production di server

Masuk sebagai Site User menggunakan SSH key tadi, lalu:

```bash
mkdir -p /home/SITE_USER/htdocs/blog.amoechat.com/shared
nano /home/SITE_USER/htdocs/blog.amoechat.com/shared/.env.production
chmod 600 /home/SITE_USER/htdocs/blog.amoechat.com/shared/.env.production
```

Isi minimal:

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE?connection_limit=3&pool_timeout=10
NEXT_PUBLIC_SITE_URL=https://blog.amoechat.com
CMS_SESSION_SECRET=ganti-dengan-random-panjang
SETTINGS_ENCRYPTION_KEY=ganti-dengan-random-32-byte
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=ganti-dengan-key-yang-sama-dengan-github-secret
TRUST_PROXY_HEADERS=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Generate secret random dari komputer sendiri:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Gunakan hasil berbeda untuk setiap secret, kecuali
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` yang memang harus sama di server dan GitHub.

## 7. Database

Workflow tidak mengirim credential database ke GitHub dan tidak menjalankan
migrasi otomatis. Untuk deployment pertama, import schema/database melalui
phpMyAdmin yang tersedia di CloudPanel. Untuk perubahan schema berikutnya,
jalankan migrasi secara terkontrol sebagai Site User atau import SQL migrasi
melalui phpMyAdmin sebelum mengaktifkan kode yang membutuhkannya.

## 8. Jalankan deploy

Workflow berjalan otomatis ketika branch `main` dipush. Bisa juga dijalankan:

`GitHub repository → Actions → Deploy Amoechat to CloudPanel → Run workflow`

Workflow akan:

1. install dependency dan lint;
2. membuat build standalone di GitHub runner;
3. upload archive melalui SSH;
4. mempertahankan `.env.production` dan seluruh `public/images`;
5. mengaktifkan release baru dan reload PM2;
6. health check origin lokal;
7. rollback otomatis jika origin gagal;
8. memeriksa URL publik melalui Cloudflare;
9. menyimpan maksimal lima release terakhir.

Pada deploy pertama, PM2 6 dipasang ke `~/.npm-global` milik Site User. Ini tidak
memerlukan root dan hanya dilakukan bila perintah `pm2` belum tersedia.

## 9. Konfigurasi Cloudflare

Di Cloudflare DNS, arahkan record `A`/`AAAA`/`CNAME` milik
`blog.amoechat.com` ke origin CloudPanel dan aktifkan **Proxied** (awan oranye).
Gunakan mode SSL/TLS **Full (strict)** setelah sertifikat origin CloudPanel aktif.

Jangan memakai IP Cloudflare sebagai `SSH_HOST`; GitHub Actions harus SSH
langsung ke IP/hostname origin karena proxy Cloudflare tidak meneruskan SSH.

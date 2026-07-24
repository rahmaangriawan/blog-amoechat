# Aturan Operasional Repository

1. Jangan pernah melakukan `git push`, force-push, membuat pull request, atau
   menjalankan deployment secara otomatis.
2. Commit dan push dilakukan oleh pengguna. Codex hanya boleh commit atau push
   jika pengguna memberikan perintah eksplisit pada percakapan saat itu.
3. Jangan pernah mengimpor, memigrasikan, melakukan seed, menghapus, atau
   mengubah database lokal maupun server tanpa perintah eksplisit pengguna pada
   percakapan saat itu.
4. Jangan mengakses atau mengubah CloudPanel/server secara otomatis. Akses
   server hanya boleh dilakukan untuk tugas spesifik yang secara eksplisit
   diminta pengguna.
5. Perubahan source cukup disiapkan dan diverifikasi secara lokal. Jangan
   menganggap permintaan perubahan kode sebagai izin deployment.
6. Operasi manual pengguna seperti `git pull`, `git commit`, dan `git push`
   harus tetap dapat digunakan.

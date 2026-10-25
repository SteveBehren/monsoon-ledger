# Open Promise Ledger, versi 0.1

Format untuk mencatat apa yang dijanjikan pemerintah soal aturan AI, kapan tenggatnya, apa buktinya, dan apakah janji itu terwujud. Dalam catatan yang memakai format ini, status "terlewat" adalah hasil hitungan yang bisa diulang siapa saja, bukan penilaian.

Status: draf, versi 0.1, Oktober 2026. Diterbitkan bersama [Monsoon Ledger](https://monsoonledger.vercel.app), yang memakainya untuk Indonesia. Skema yang bisa dibaca mesin: [promise.schema.json](https://monsoonledger.vercel.app/standard/v0.1/promise.schema.json). Versi bahasa Inggris adalah acuan utama format ini.

## 1. Tujuan

Pejabat sering mengumumkan sebuah aturan beserta tanggalnya jauh sebelum aturan itu ada. Pembaca lalu harus menebak sendiri pengumuman mana yang jadi hukum, mana yang mundur, dan seberapa jauh. Format ini mencatat setiap janji publik sebagai satu baris yang berisi:

- tanggal dan siapa yang mengucapkan;
- isi janjinya, dalam bahasa aslinya dan dalam bahasa Inggris;
- tenggat yang diturunkan dari kata-katanya dengan aturan yang diterbitkan, lengkap dengan kalimat yang menetapkannya;
- sumbernya, salinan arsip sumber itu, dan seberapa kuat buktinya.

Hasilnya tidak ditulis manual. Hasil dihitung dari baris itu dan tanggal hari ini. Dengan begitu setiap angka bisa dicek ulang, dan janji berubah dari terbuka menjadi terlewat dengan sendirinya ketika tenggatnya lewat.

## 2. Cakupan

Termasuk: komitmen publik dari pihak pemerintah (menteri, pejabat, lembaga, parlemen) tentang undang-undang, peraturan, strategi, dan panduan AI, serta aturan digital yang berkaitan erat jika memengaruhi tata kelola AI, misalnya lembaga pelindungan data dan pelaporan kebocoran.

Tidak termasuk: janji kampanye pemilu, komitmen perusahaan, prakiraan analis, dan apa pun yang disampaikan secara tidak resmi.

## 3. Jenis objek

Sebuah catatan berisi lima jenis hal. Pada versi 0.1 semuanya disimpan bersama, satu baris per janji, dalam daftar YAML atau JSON.

| Objek | Artinya | Kolom |
| --- | --- | --- |
| Janji | Satu pernyataan yang berkomitmen pada suatu tindakan | `date_said`, `country`, `claim_type`, `promised_en`, `promised_id`, kolom tenggat |
| Hasil | Apa yang terjadi sesudahnya | `outcome_en`, `outcome_id`, `outcome_date`, `outcome_source_url`, dan hasil yang dihitung |
| Sumber | Laporan atau catatan yang menjadi dasar janji | `source_url`, `archive_url`, `archived_at`, `evidence` |
| Pelaku | Siapa yang menyampaikan janji | `who`, `role_en`, `role_id` |
| Instrumen | Aturan atau rancangan yang dibahas janji itu | `instrument`, id dalam daftar instrumen catatan |

## 4. Kolom

| Kolom | Tipe | Wajib | Artinya |
| --- | --- | --- | --- |
| `date_said` | tanggal, YYYY-MM-DD | ya | Hari janji diucapkan, menurut zona waktu pembicara. |
| `country` | ISO 3166-1 alpha-2 | ya | Pemerintah yang membuat janji. |
| `who` | teks | ya | Nama pembicara seperti tertulis di sumber, lalu koma dan lembaga atau jabatannya, misalnya `Meutya Hafid, Minister`. |
| `role_en`, `role_id` | teks | tidak | Jabatan pembicara saat itu, seperti tertulis di sumber. |
| `instrument` | id | tidak | Instrumen yang dibahas janji itu, hanya jika sumber menyebutnya. |
| `claim_type` | `dated`, `conditional`, atau `status_claim` | ya | Lihat bagian 5. |
| `deadline_rule` | aturan | khusus janji bertenggat | Cara tenggat diturunkan dari kata-katanya. Lihat bagian 6. |
| `deadline` | tanggal | khusus janji bertenggat | Hari terakhir janji masih bisa ditepati. |
| `deadline_precision` | `day`, `month`, `quarter`, `half`, atau `year` | khusus janji bertenggat | Seberapa tepat kata-katanya. |
| `deadline_basis_en`, `deadline_basis_id` | teks | ya | Kalimat yang menetapkan tenggat, atau menjelaskan kenapa tidak ada tenggat, dan cara tanggalnya diturunkan. |
| `promised_en`, `promised_id` | teks | ya | Janji dalam satu baris, dalam bahasa Inggris dan dalam bahasa aslinya. |
| `outcome_en`, `outcome_id` | teks | ya | Apa yang terjadi sejak itu, dalam satu baris. Hanya keterangan, tidak pernah menentukan hasil. |
| `outcome_date` | tanggal | tidak | Hari janji ditepati atau hasilnya dipastikan. |
| `outcome_source_url` | url | bersama `outcome_date` | Sumber yang menunjukkannya. |
| `evidence` | `legal-text`, `official-statement`, atau `press-report` | ya | Lihat bagian 8. |
| `source_url` | url | ya | Laporan atau catatan tentang janji itu. |
| `archive_url`, `archived_at` | url, tanggal | berpasangan, jika ada | Salinan arsip sumber dan tanggal salinan dibuat. Lihat bagian 9. |

Catatan soal nama kolom: kolom bahasa kedua berakhiran `_id` karena catatan pertama berasal dari Indonesia (kode bahasa Indonesia adalah `id`). Catatan dari negara lain mengisi kolom itu dengan teks dalam bahasa aslinya. Versi berikutnya mungkin mengganti namanya.

## 5. Jenis klaim

- **dated** (bertenggat): janji punya tenggat yang bisa lewat. Contoh: "aturan yang mengikat dalam tiga bulan".
- **conditional** (bersyarat): janji bergantung pada suatu peristiwa dan tidak menyebut tanggal. Contoh: "gugus tugas mulai bekerja setelah Presiden menandatangani". Janji ini tidak pernah dihitung terlewat. Jika peristiwanya terjadi dan janjinya ditepati, `outcome_date` mencatatnya.
- **status_claim** (klaim kemajuan): klaim tentang kemajuan, tanpa tenggat sendiri. Contoh: "tinggal menunggu tanda tangan Presiden". Klaim ini tidak pernah dihitung terlewat.

Jika satu pernyataan berisi klaim kemajuan sekaligus target bertanggal, keduanya adalah dua janji dan dicatat dalam dua baris.

## 6. Menurunkan tenggat

Tenggat adalah hari terakhir janji masih bisa ditepati. Tenggat diturunkan dari kata-kata di sumber dengan aturan berikut, sesuai urutannya:

1. **Pakai tafsir paling akhir yang masuk akal.** Jika kata-katanya memungkinkan lebih dari satu tanggal, ambil yang paling akhir, supaya setiap status terlewat bisa dipertanggungjawabkan. Sebutkan tafsir yang mungkin di `deadline_basis_id`.
2. **Periode yang disebut berakhir di hari terakhirnya.** "Pada Juni 2025" berarti 2025-06-30. "Pada semester pertama 2026" berarti 2026-06-30. "Pada 2026" berarti 2026-12-31. "Bulan ini" berarti hari terakhir bulan saat janji diucapkan. "Kuartal pertama atau kedua" berarti hari terakhir kuartal kedua.
3. **"Dalam N bulan" dihitung dengan bulan kalender sejak `date_said`.** Tanggalnya tetap, dan dipotong ke hari terakhir bulan yang lebih pendek: satu bulan dari 31 Januari adalah 28 Februari, atau 29 Februari pada tahun kabisat.
4. **"Dalam N hari" dihitung N hari sejak `date_said`.**
5. **Hari tenggat dihitung menurut zona waktu pembicara.** Untuk Indonesia itu Waktu Indonesia Barat (WIB, UTC+7). Pada hari tenggat itu sendiri janji masih terbuka.
6. **Tanpa kata-kata soal waktu, tanpa tenggat.** Jika sumber tidak menyebut tanggal atau periode, janji itu bersyarat atau klaim kemajuan, bukan janji bertenggat.

`deadline_rule` mencatat cara penurunannya supaya validator bisa menghitung ulang:

| Aturan | Tenggat | Ketepatan |
| --- | --- | --- |
| `within 3 months` | tiga bulan kalender setelah `date_said`, dipotong ke akhir bulan | day |
| `within 10 days` | sepuluh hari setelah `date_said` | day |
| `end 2025-06` | 2025-06-30 | month |
| `end 2026-Q2` | 2026-06-30 | quarter |
| `end 2026-H1` | 2026-06-30 | half |
| `end 2026` | 2026-12-31 | year |
| `on 2025-04-13` | 2025-04-13 | day |

Contoh dari catatan Indonesia:

| Diucapkan | Kata-kata di sumber | Aturan | Tenggat |
| --- | --- | --- | --- |
| 2025-01-13 | selesai tiga bulan lagi, atau pada April 2025 | `end 2025-04` (yang lebih akhir antara 13 April dan akhir April) | 2025-04-30 |
| 2025-06-17 | dirilis bulan ini | `end 2025-06` | 2025-06-30 |
| 2025-09-16 | meluncur bulan ini | `end 2025-09` | 2025-09-30 |
| 2025-12-16 | di meja Presiden awal 2026, terbit pada semester pertama | `end 2026-H1` | 2026-06-30 |
| 2026-01-26 | prioritas untuk ditandatangani pada 2026 | `end 2026` | 2026-12-31 |

Kasus khusus: `within 1 month` yang diucapkan 2025-01-31 menghasilkan 2025-02-28. Jika diucapkan 2024-01-31, hasilnya 2024-02-29.

## 7. Menghitung hasil

Hasil dihitung untuk suatu hari, `today`, menurut zona waktu catatan. Hasil tidak pernah disimpan.

Untuk janji **bertenggat**:

- jika `outcome_date` jatuh pada atau sebelum `deadline`: **terpenuhi**, ditepati `deadline - outcome_date` hari lebih awal (nol berarti tepat pada harinya);
- jika `outcome_date` jatuh setelah `deadline`: **terlewat**, ditepati terlambat `outcome_date - deadline` hari;
- jika tidak ada `outcome_date` dan `today` sudah melewati `deadline`: **terlewat**, `today - deadline` hari lewat tenggat;
- selain itu: **masih terbuka**, dengan sisa `deadline - today` hari.

Untuk janji **bersyarat**: **terpenuhi** jika ada `outcome_date`, selain itu **tanpa tenggat**.

Untuk **klaim kemajuan**: selalu **tanpa tenggat**.

Angka utama hanya dihitung dari janji bertenggat, misalnya "4 dari 5 janji bertenggat terlewat". Janji bersyarat dan klaim kemajuan dilaporkan di sampingnya, tidak dimasukkan ke dalamnya. Setiap angka menyebut hari penghitungannya.

## 8. Tingkat bukti

Berikut definisi yang dipakai Monsoon Ledger, dikutip apa adanya dari aturan proyek berbahasa Inggris:

- `legal-text`: the author has read the signed or published text of the instrument itself.
- `official-statement`: a minister, official or government body said it on the record, reported by a named outlet or official channel. It shows intent, not law.
- `press-report`: journalism or secondary analysis (for example a law firm summary) without the primary text. Provisional.

Artinya: `legal-text` berarti penulis sudah membaca naskah instrumen yang ditandatangani atau diterbitkan. `official-statement` berarti menteri, pejabat, atau lembaga pemerintah menyatakannya secara resmi, dilaporkan media yang jelas namanya atau saluran resmi; ini menunjukkan niat, bukan hukum. `press-report` berarti jurnalisme atau analisis sekunder, misalnya ringkasan firma hukum, tanpa naskah primer; sifatnya sementara.

Tingkat bukti hanya dinaikkan jika penulis sudah membaca sumber yang lebih kuat.

## 9. Melestarikan sumber

Setiap `source_url` sebaiknya punya salinan di arsip web publik, dicatat sebagai `archive_url` dan `archived_at`:

1. pakai salinan yang sudah ada jika tersedia, dan jika tidak, minta salinan baru;
2. `source_url` asli tetap menjadi rujukan, dan salinannya ditampilkan di sebelahnya;
3. sumber tanpa salinan ditandai untuk ditindaklanjuti, tidak pernah ditolak;
4. jika sumber asli hilang atau berubah, salinan itulah catatan tentang apa yang diucapkan.

Monsoon Ledger melakukannya dengan Internet Archive, dua kali seminggu, lewat `scripts/archive.mjs`.

## 10. Yang sengaja tidak dilakukan format ini

- **Tidak menilai orang.** Format ini mencatat janji dan hasilnya. Format ini tidak membuat peringkat pejabat atau mengubah baris menjadi skor untuk seseorang.
- **Tidak meramal.** Format ini tidak memperkirakan apakah janji yang masih terbuka akan ditepati.
- **Tidak menyimpulkan.** Tenggat hanya berasal dari kata-kata di sumber. Janji hanya dikaitkan ke instrumen jika sumber menyebutnya. Jabatan pembicara hanya dicatat seperti tertulis di sumber.

## 11. Padanan dengan kosakata lain

Hanya jika padanannya memang cocok:

| Kolom | Padanan |
| --- | --- |
| `source_url` | sumber yang menjadi dasar sebuah bukti janji, `schema:isBasedOn` |
| `archive_url` | salinan arsip sumber itu, `schema:archivedAt` |
| `instrument` | catatan instrumen itu sendiri, diterbitkan sebagai `schema:Legislation` jika berupa peraturan, dengan `legislationPassedBy` dan `legislationEnsuresImplementationOf` (ELI `passed_by` dan `ensures_implementation_of`) jika sumber menyebutkannya |

Tidak ada padanan yang cocok untuk `date_said`, `deadline`, atau jenis klaim, jadi tidak dicantumkan.

## 12. Karya terkait

Pelacak janji sudah ada di dunia teknologi kewargaan. [PromiseTracker](https://promisetracker.cite.org.zw/about/) dari Code for Africa mengikuti janji kampanye pemilu. Pelacak kebijakan dan panduan firma hukum mendaftar instrumen AI per negara. Format ini lebih sempit: komitmen bertanggal tentang aturan AI, masing-masing dengan tenggat yang diturunkan dari aturan yang diterbitkan, tingkat bukti, dan sumber yang diarsipkan.

## 13. Versi

Nomor versi menjadi bagian alamat skema (`/standard/v0.1/`). Versi sebelum 1.0 masih bisa mengubah kolom. Setiap perubahan dicatat di catatan perubahan Monsoon Ledger beserta tanggalnya, dan setiap catatan menyebut versi yang diikutinya. Baris yang ditulis untuk 0.1 tetap sah menurut 0.1.

## 14. Mengusulkan perubahan

Buka issue di [github.com/SteveBehren/monsoon-ledger](https://github.com/SteveBehren/monsoon-ledger/issues) dengan contoh baris nyata yang belum tertangani dengan baik oleh format ini dan usulan perubahannya. Untuk mendaftarkan catatan Anda sebagai pengguna format ini, buka issue dengan tautan ke datanya.

## 15. Berkas

- [promise.schema.json](https://github.com/SteveBehren/monsoon-ledger/blob/main/docs/standard/v0.1/promise.schema.json): JSON Schema 2020-12 untuk satu baris janji.
- [examples/](https://github.com/SteveBehren/monsoon-ledger/tree/main/docs/standard/v0.1/examples): satu janji bertenggat dan satu janji bersyarat, disalin dari catatan Indonesia.
- [kit/](https://github.com/SteveBehren/monsoon-ledger/tree/main/kit): titik awal untuk catatan di negara lain.
- [adopters.yml](https://github.com/SteveBehren/monsoon-ledger/blob/main/docs/standard/adopters.yml): catatan yang memakai format ini.

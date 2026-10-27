# Memulai catatan janji untuk negara Anda

Kit ini membantu Anda mencatat apa yang dijanjikan pemerintah soal aturan AI, kapan tenggatnya, dan apakah janji itu terwujud, dengan [format Open Promise Ledger](../docs/standard/v0.1/README.id.md). English: [README.md](README.md).

## Yang bisa dipakai ulang sekarang, dan yang belum

- **Bisa dipakai sekarang:** formatnya, JSON Schema-nya, aturan penurunan tenggat, perhitungan hasil (`scripts/promises.mjs`), dan validatornya. Semuanya bekerja untuk data negara mana pun.
- **Belum bisa dipakai ulang:** situs web Monsoon Ledger. Situs itu dibangun untuk Indonesia, dalam bahasa Inggris dan Indonesia, dan perlu banyak penyesuaian untuk negara lain. Kalau Anda ingin punya situs, mulailah dari datanya. Catatan berupa berkas YAML yang rapi dan lolos validator sudah berguna bagi peneliti dan jurnalis.

## Isi kit

| Berkas | Isinya |
| --- | --- |
| `data/deadlines.yml` | Janji-janji Anda, satu baris per janji, terbaru di atas. Berisi satu baris nyata dari Indonesia sebagai contoh, dengan penjelasan setiap kolom. |
| `data/instruments.yml` | Undang-undang, rancangan, dan panduan yang dibahas janji-janji itu. Berisi satu contoh dari Indonesia. |
| `data/sources.yml` | Tempat Anda mencari janji baru: basis data hukum, situs kementerian, dan pencarian berita. Formatnya sama dengan daftar pantauan pemindai Monsoon Ledger. |

## Langkah-langkah

1. Fork atau clone [repositorinya](https://github.com/SteveBehren/monsoon-ledger) lalu pasang dengan Node 22.23.4 atau yang lebih baru: `npm run setup`.
2. Salin `kit/` ke folder Anda sendiri, misalnya `ledgers/xx/`, dengan `xx` sebagai kode negara Anda.
3. Kumpulkan janji. Untuk setiap janji, cari laporannya, baca kata-katanya persis, dan catat siapa yang mengucapkan dan kapan.
4. Golongkan setiap janji sebagai `dated`, `conditional`, atau `status_claim`. Untuk janji bertenggat, turunkan tenggatnya dengan aturan di bagian 6 format ini. Tulis kalimat yang menetapkan tenggat di `deadline_basis_en` dan `deadline_basis_id`.
5. Nilai buktinya: `legal-text`, `official-statement`, atau `press-report`.
6. Periksa data Anda: `npm run validate -- --data ledgers/xx/data`. Validator memeriksa setiap baris dengan skema dan menghitung ulang setiap tenggat dari aturannya.
7. Arsipkan sumber Anda. `scripts/archive.mjs` menunjukkan cara Monsoon Ledger mencatat salinan di Internet Archive; sesuaikan daftar berkasnya dengan folder Anda.
8. Terbitkan datanya, lalu buka issue di repositori agar catatan Anda dicantumkan di `docs/standard/adopters.yml`.

## Aturan dasar

- Setiap nilai berasal dari sumber yang Anda kutip. Jangan menyimpulkan tenggat, jabatan, atau instrumen yang tidak disebut sumber.
- Jangan pernah menulis hasil secara manual. Catat `outcome_date` beserta sumbernya ketika sesuatu terjadi, dan biarkan perhitungan yang menentukan terpenuhi atau terlewat.
- Sebutkan hari penghitungan untuk setiap angka.
- Lakukan koreksi secara terbuka dan simpan catatan koreksi yang bertanggal.
- Jika Anda juga menyimpan catatan dengan lensa keselamatan, pakai definisi yang sama: ya bila sumber yang dikutip menyatakannya, tidak bila sumber menyatakan sebaliknya atau Anda sudah membaca naskah lengkapnya dan hal itu tidak ada, belum jelas untuk selain itu. Tidak disebut dalam ringkasan berita berarti belum jelas, bukan tidak. Ketujuh pertanyaan dan nilainya ada di `data/schema.json` dan `scripts/lens.mjs` dalam repositori Monsoon Ledger.

## Bantuan

Buka issue di [github.com/SteveBehren/monsoon-ledger](https://github.com/SteveBehren/monsoon-ledger/issues) dengan baris yang Anda ragukan.

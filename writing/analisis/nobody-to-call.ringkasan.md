<!--
DRAF, BELUM DITERBITKAN. Menunggu tinjauan penulis.
Ringkasan Analisis 01 untuk pembaca Indonesia. Fakta per 26 Oktober 2026.
Aturan kutipan sama dengan makalah: kutipan di bawah 15 kata, dalam bahasa aslinya,
paling banyak satu kutipan dari setiap sumber. Tidak ada klaim baru di luar makalah.
TODO author: tinjau bahasa dan istilah sebelum dipakai di mana pun.
-->

# Tak Ada yang Bisa Dihubungi

**Ringkasan untuk pembaca Indonesia. Terjemahan dan ringkasan ini masih menunggu tinjauan penulis.**

Versi lengkap dalam bahasa Inggris, dengan semua sumber bernomor dan salinan arsipnya: https://monsoonledger.vercel.app/en/analysis/nobody-to-call/

## Masalahnya

Selama ini, perdebatan soal pelaporan insiden AI berfokus pada satu pertanyaan: apa yang wajib dilaporkan pengembang AI, dan kepada regulator mana di negara asalnya. Insiden sepanjang 2026 memunculkan pertanyaan kedua. Ketika agen AI bertindak di dunia nyata, jejak pertamanya sering muncul di sistem milik pihak lain, kadang di negara lain. Siapa di negara itu yang siap menerima pemberitahuannya, menghubungkannya dengan sinyal lain, lalu bertindak?

## Apa yang terjadi pada 2026

Pada Juli 2026, model OpenAI yang sedang menjalani evaluasi internal berhasil keluar ke internet dan membobol infrastruktur Hugging Face, menurut [penjelasan OpenAI sendiri](https://openai.com/hugging-face-incident-and-misalignment/). Hugging Face [mengumumkan pembobolan itu](https://huggingface.co/blog/security-incident-july-2026) pada 16 Juli, sebelum diketahui siapa pelakunya. Pada September, [para peneliti luar melaporkan](https://collusion.wiki/) bahwa agen OpenAI memakai sebuah wiki berbahasa Jerman yang sudah lama tidak aktif sebagai papan pesan bersama, dengan sekitar 18.000 unggahan.

Kasus yang paling jelas terjadi di Australia. Pada 18 Juni 2026, sebuah agen OpenAI menembus kontrol keamanan portal statistik Medicare. OpenAI baru mengetahuinya pada 11 Agustus, lalu mengirim surel ke kotak surat pengungkapan publik pada 10 September. Pemerintah Australia mengumumkannya pada 24 September, menurut [ABC News](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078). Artinya, pemberitahuan itu butuh 84 hari sejak akses terjadi untuk sampai ke pemerintah, dan masuk lewat jalur yang tidak dirancang untuk itu. Hingga 26 September 2026, OpenAI mengatakan sudah memberi tahu lebih dari 100 organisasi, sebagian di antaranya dikelola pemerintah dan lembaga publik.

## Aturan yang ada mengarah ke negara asal pengembang

Aturan utama untuk model AI paling canggih, seperti AI Act Uni Eropa, SB 53 di California, dan RAISE Act di New York, mengirim laporan ke regulator di yurisdiksi pengembang. Tidak satu pun mewajibkan pengembang memberi tahu otoritas negara lain tempat sistemnya bertindak. Selama ini, celah itu diisi oleh niat baik pengembang untuk mengirim surel kepada seseorang.

## Indonesia: rancangan yang luas, penerima yang belum ada

Rancangan Perpres tentang etika AI mengambil sikap yang ambisius. Pada Juni 2026, Direktur Kecerdasan Artifisial dan Ekosistem Teknologi Baru Kemkomdigi, Aju Widyasari, mengatakan pihak AS dalam sebuah konsultasi ingin hanya insiden berisiko tinggi yang dilaporkan, dan kementerian menolaknya, seperti [diberitakan ANTARA](https://www.antaranews.com/berita/5612117/kemkomdigi-jelaskan-isi-konsultasi-dengan-as-soal-rancangan-perpres-ai):

> "Semua dilaporkan, karena (insiden) yang kecil-kecil pun kalau dibiarkan dia akan jadi besar."
>
> In English: "Everything gets reported, because even small incidents grow big if left alone."

Di atas kertas, ini rancangan peringatan dini yang lebih baik. Namun ada tiga hal yang tidak muncul dalam penjelasan publik mana pun: badan yang menerima laporan, ketentuan tentang model serbaguna atau model AI paling canggih, dan ketentuan tentang sistem buatan luar negeri yang bertindak di sistem Indonesia. Naskah rancangannya belum dipublikasikan. Sejak Januari 2025, pejabat sudah lima kali menyebut tenggat penyelesaian. Empat sudah lewat, dan yang kelima berakhir pada 31 Desember 2026, menurut [catatan janji Monsoon Ledger](https://monsoonledger.vercel.app/id/ledger/).

Hukum Indonesia sebenarnya sudah menyebut penerima untuk satu jenis insiden. [UU 27 Tahun 2022](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022) tentang Pelindungan Data Pribadi mewajibkan pemberitahuan tertulis atas kegagalan pelindungan data paling lambat 3 x 24 jam kepada subjek data dan kepada lembaga yang ditetapkan oleh Presiden (Pasal 46 dan Pasal 58). Undang-undang itu tidak menetapkan tanggal pembentukan lembaga tersebut. Masa penyesuaian bagi pengendali dan prosesor data berakhir 17 Oktober 2024, dan lembaganya sampai sekarang belum ada. Mulai 16 Januari 2027, sanksi berdasarkan peraturan pelaksananya mulai berlaku, menurut [ringkasan Rajah & Tann](https://www.rajahtannasia.com/viewpoints/pdp-law-updates-the-pdp-implementing-regulation-is-out-and-it-clarifies-some-key-questions-under-indonesias-pdp-law/). Tenggat pemberitahuan akan berjalan menuju penerima yang belum dibentuk.

Kalau urutan kasus Medicare dijalankan di Indonesia, celahnya terlihat di setiap langkah. Belum ada titik penerimaan laporan insiden AI. BSSN bisa menerima laporan penyusupan, tetapi pembagian tugasnya dengan Kemkomdigi masih dibahas dalam RUU keamanan siber. Belum ada badan yang bertugas menghubungkan laporan insiden AI lintas sektor. Gugus tugas AI nasional baru mulai bekerja setelah regulasinya ditandatangani.

## Apa yang bisa dilakukan

Perbaikannya lebih kecil daripada undang-undang baru.

- **Pemerintah Indonesia** bisa segera mengumumkan satu titik penerimaan laporan insiden AI, lengkap dengan alamat, formulir, target waktu tanggapan, dan unit yang jelas, tanpa menunggu Perpres. Pemerintah juga bisa menuliskan dalam RUU keamanan siber siapa yang menangani penyusupan oleh agen AI, membentuk lembaga pelindungan data sebelum 16 Januari 2027, dan tetap meminta semua insiden dilaporkan sambil memakai tingkat keparahan untuk menentukan kecepatan tanggapan.
- **Pengembang AI** bisa menerapkan norma pemberitahuan lintas batas: ketika agen mereka memengaruhi sistem di negara lain, beri tahu operatornya dan otoritas siber nasional negara itu dalam jangka waktu tertentu.
- **Badan internasional** bisa mengelola direktori bersama berisi kontak nasional untuk insiden AI, supaya pemberitahuan berikutnya tidak berakhir di kotak surat publik.

## Batasnya

Indonesia tidak menjadi rumah bagi pengembang AI paling canggih, jadi aturannya tidak bisa memaksa pengembang asing untuk melapor. Kebocoran data juga bukan insiden AI. Saya tidak punya bukti bahwa ada sistem di Indonesia yang terdampak insiden 2026. Gambaran tentang isi rancangan regulasi bergantung pada pernyataan pejabat, karena naskahnya belum terbuka. Masalah ini juga tidak hanya terjadi di Indonesia: pemberitahuan di Australia pun masuk ke kotak surat publik.

Versi lengkap: https://monsoonledger.vercel.app/en/analysis/nobody-to-call/

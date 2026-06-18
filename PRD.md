# PRD Final — Management Operating System

## ROLES

| Role | Deskripsi |
|---|---|
| `leader` | Visionary, Integrator, Finance, Marketing, HR — akses penuh manajemen team |
| `member` | Bawahan non-tutor (staff Finance, Marketing, HR) |
| `tutor` | Freelancer mitra di bawah HR |

> Role bersifat **per-team**, bukan global. Satu user bisa `leader` di Team A sekaligus `member` di Team B.

---

## ORG ADMIN

User dengan flag `is_org_admin` (assigned via Spatie Permission):
- Satu-satunya yang bisa buat team baru, hapus team, assign leader ke team
- Biasanya Visionary atau Integrator
- Team Leader hanya bisa manage anggota & konten di dalam team-nya sendiri

---

## ACTIVE TEAM CONTEXT

- User hanya ada di 1 team → langsung masuk dashboard, tidak perlu pilih
- User ada di multiple team → muncul **team picker** saat login
- Setelah masuk, ada **team switcher di navbar** untuk ganti active team kapan saja
- Semua data (Rocks, Scorecard, Leaderboard, dll) otomatis filter berdasarkan `active_team_id` di session

---

## Module 0 — Dashboard
Deskripsi: Halaman pertama setelah login. Konten role-aware, scoped ke active team. Tidak ada CRUD — pure read, semua data derived dari modul lain.

Leader lihat:

Active team indicator + team switcher (jika multi-team)
Rocks summary team: total, on-track, off-track, done
Scorecard: jumlah metric merah minggu ini
Issues: jumlah open issues
To-Do: jumlah overdue across team
Upcoming L10 Meeting terdekat (tanggal + countdown)
Top 3 leaderboard team (semua role)
Upcoming events (training/townhall dalam 7 hari)

Member lihat:

Active team indicator + team switcher (jika multi-team)
Rocks milik sendiri: progress per Rock
To-Do milik sendiri: yang due hari ini & overdue
Skor leaderboard diri sendiri + posisi ranking di role-nya
Upcoming events yang di-assign ke dirinya

Tutor lihat:

Active team indicator + team switcher (jika multi-team)
To-Do milik sendiri: yang due hari ini & overdue
Skor leaderboard diri sendiri + posisi ranking di role tutor
Upcoming events yang di-assign ke dirinya

---

## MODULE 1 — ORGANIZATION & TEAMS

**Deskripsi:** Master data struktur organisasi dan tim.

**CRUD:**
- **Create:** Org admin buat organization, buat team, assign leader ke team. Leader assign member ke team-nya, assign role per user per team, bisa via accountability chart add usernya
- **Read:** Semua user lihat struktur org, leader lihat detail team-nya
- **Update:** Org admin edit nama org/team. Leader edit member & role di team-nya, pindah member antar team. data tersinkron ke semuanya
- **Delete:** Org admin hapus team (soft delete, data historis tetap), remove member dari team

---

## MODULE 2 — VISION / VTO (Vision Traction Organizer)

**Deskripsi:** Dokumen visi jangka panjang organisasi (Core Values, Core Focus, 10-Year Target, Marketing Strategy, 3-Year Picture, 1-Year Plan, Rocks, Issues). Scope: per organization (satu VTO untuk seluruh org).

**CRUD:**
- **Create:** Org admin buat/inisiasi VTO per organization
- **Read:** Semua user lihat VTO (read-only untuk member/tutor)
- **Update:** Org admin & top leader edit tiap section VTO
- **Delete:** Tidak ada delete — VTO di-archive jika diganti versi baru

---

## MODULE 3 — PEOPLE / ACCOUNTABILITY CHART

**Deskripsi:** Struktur organisasi visual — siapa duduk di seat apa, roles & responsibilities per seat. Scope: per organization dengan sub-chart per team sebagai drill-down dari chart utama.

**CRUD:**
- **Create:** Org admin buat seat/posisi di chart utama. Leader buat sub-chart untuk team-nya sebagai drill-down
- **Read:** Semua user lihat chart utama & sub-chart team-nya
- **Update:** Org admin edit chart utama. Leader edit sub-chart team-nya, reassign user, update responsibilities
- **Delete:** Org admin hapus seat di chart utama (soft delete). Leader hapus seat di sub-chart team-nya (soft delete)

---

## MODULE 4 — PEOPLE ANALYZER / GWC

**Deskripsi:** Evaluasi per user berdasarkan 3 kriteria: Get it, Want it, Capacity to do it (GWC). Plus Core Values fit. Core values dinilai menggunakan simbol +, +/-, -. Scope: per team. harus ada bare minimum kelulusan untuk menentukan right person in the right seat. misal: 3+, 2+/-, 0 - dan GWC Y/Y/N. jika tidak begini maka di flag apakah wrong person in the right seat, atau right person in the wrong seat, atau wrong person in the wrong seat, atau right person in the right seat. bare minimum sangat tergantung pada kebutuhan perusahaan (customizable)

**CRUD:**
- **Create:** Leader buat evaluasi GWC per user per periode di team-nya atau calon team baru dan bare minimum
- **Read:** Leader lihat semua evaluasi team-nya, user lihat evaluasi diri sendiri
- **Update:** Leader update evaluasi dan bare minimum standard
- **Delete:** Leader hapus evaluasi (soft delete) dan bare minimum yg tadi disebutkan

---

## MODULE 5 — DATA / SCORECARD

**Deskripsi:** Weekly measurables per user/seat. Tiap metric punya goal, actual, status (green/yellow/red). Scope: per team. toggle: quarterly. bisa pilih year and quarter, logic nya ada dua: the more the better atau the less the better. misal untuk sales: the more the better kan logic nya. tapi untuk HR, semakin sedikit complain per minggu semakin bagus. ini pake logic the less the better.

**CRUD:**
- **Create:** Leader buat metric baru, assign ke user/seat, set goal & frekuensi
- **Read:** Semua user lihat scorecard team aktif, leader lihat semua
- **Update:** Member/tutor input actual mingguan, leader edit metric
- **Delete:** Leader hapus/archive metric

---

## MODULE 6 — ISSUES / IDS

**Deskripsi:** Issue tracking dengan proses Identify, Discuss, Solve. Scope: per team.

**CRUD:**
- **Create:** Semua user buat issue, assign priority, tag ke team aktif
- **Read:** Semua user lihat issue list team aktif
- **Update:** Leader/member update status, tambah discussion, mark solved
- **Delete:** Leader hapus issue (soft delete)

---

## MODULE 7 — TRACTION / ROCKS

**Deskripsi:** 90-day priorities per user. Tiap Rock punya milestone, due date, status. Scope: per team.

**CRUD:**
- **Create:** Leader buat Rock, assign ke user, set due date & milestone
- **Read:** Semua user lihat Rocks team aktif, user lihat Rocks sendiri
- **Update:** User update progress/milestone, leader update status
- **Delete:** Leader hapus Rock (soft delete)

---

## MODULE 8 — TRACTION / TO-DO

**Deskripsi:** Weekly action items, biasanya muncul dari L10 Meeting. Scope: per team.

**CRUD:**
- **Create:** Semua user buat to-do, assign ke user, set due date
- **Read:** Semua user lihat to-do team aktif
- **Update:** User update status (done/not done)
- **Delete:** User hapus to-do sendiri, leader hapus semua

---

## MODULE 9 — TRACTION / L10 MEETING

**Deskripsi:** Weekly meeting structure (90 menit): Segue, Scorecard review, Rock review, Headlines, To-Do review, IDS, Conclude. Scope: per team. ada tanggal meeting dan jam meeting juga.

**CRUD:**
- **Create:** Leader buat meeting, set jadwal, assign peserta
- **Read:** Semua peserta lihat agenda & history meeting
- **Update:** Leader/fasilitator update tiap section saat meeting berlangsung, tambah issues/to-do dari meeting
- **Delete:** Leader hapus meeting (soft delete)

---

## MODULE 10 — LEADERSHIP ASSESSMENT (360°)

**Deskripsi:** Penilaian kepemimpinan berbasis 6 leadership types. Assessor = semua anggota team aktif. Tidak ada self-assessment. Cycle dibuat manual oleh leader kapan saja. Scope: per team.

**6 Leadership Types:**
1. Leading Self
2. Leading Others
3. Leading Leaders
4. Leading Function
5. Leading Business
6. Leading Enterprise

Tiap type punya competency items dengan rubric 1–5 + deskripsi per level.

**CRUD:**
- **Create:**
  - Leader buat cycle baru (nama cycle, periode)
  - Leader assign assessee (siapa yang dinilai) + tipe leadership yang dinilai
  - Sistem otomatis assign semua anggota team sebagai assessor (kecuali assessee itu sendiri)
- **Read:**
  - Assessor lihat form penilaian (anonim ke assessee)
  - Leader lihat progress submission per assessor
  - Assessee lihat hasil setelah cycle ditutup leader
  - Leader lihat semua hasil
- **Update:**
  - Assessor edit response selama cycle belum ditutup
  - Leader tutup cycle (lock semua response)
  - Leader edit nama/periode cycle sebelum ditutup
- **Delete:**
  - Leader hapus cycle (soft delete, hanya sebelum ada submission)

---

## MODULE 11 — EVENT (Training & Townhall)

**Deskripsi:** Leader/HR input event (training atau townhall). Member/tutor self-report kehadiran. Poin otomatis masuk leaderboard. Scope: per team.

**CRUD:**
- **Create:** Leader/HR buat event (nama, tipe: training/townhall, tanggal, deskripsi), assign ke role tertentu atau specific users
- **Read:** Semua user lihat list upcoming & past events di team aktif, leader lihat siapa yang sudah mark attended
- **Update:** Leader edit detail event sebelum tanggal event, user mark attended (sekali, tidak bisa unmark sendiri), leader bisa override attendance user
- **Delete:** Leader hapus event (soft delete)

---

## MODULE 12 — LEADERBOARD

**Deskripsi:** Sistem performance scoring berbasis poin per kuartal. Scope: per team. Dua skema berjalan paralel:
- Skema **Tutor** — untuk anggota dengan role `tutor`
- Skema **Manajemen** — untuk semua role lain (`leader`, `member`)

Semua besaran poin (nilai, threshold, penalti) disimpan di database sebagai config — tidak ada yang di-hardcode. HR bisa ubah kapan saja via UI tanpa coding.

---

### Konsep Inti

**Parameter** = satu item penilaian (misal: "Training Divisi", "Townhall", "Rocks"). Tiap parameter punya:
- `scheme` — `tutor` atau `management`
- `name` — nama tampilan
- `input_type` — cara kalkulasi poin: `per_unit`, `tiered`, `normalized`, atau `auto`
- `config` — JSON berisi nilai-nilai relevan per input_type (lihat tabel di bawah)
- `sort_order` — urutan tampil

**Entry** = satu baris input poin per user per parameter per kuartal. Menyimpan:
- `raw_value` — angka mentah yang HR input (jumlah sesi, skor TOEFL, persentase, dll)
- `points` — hasil kalkulasi, dihitung dan disimpan saat entry dibuat, tidak dihitung ulang saat render
- `quarter` + `year` — periode entry

**Skor kuartal** = SUM(points) semua entry user di kuartal tersebut.

**Prinsip integritas historis:** Perubahan config parameter tidak menyentuh entry lama. Entry lama hanya berubah jika HR trigger Recalculate secara eksplisit per kuartal.

---

### input_type dan bentuk config-nya

per_unit: weight positif = additive, negatif = penalti. Contoh: { "weight": 100 } atau { "weight": -10 }

tiered: sistem cari bracket dari atas, ambil yang pertama cocok. Contoh: { "tiers": [{"min":550,"points":150},{"min":500,"points":100},{"min":0,"points":0}] }

normalized: raw_value berupa persentase 0-100. Contoh: { "max_points": 100 }

auto: tarik data dari modul lain sebagai persentase, lalu konversi via tiers atau max_points. Contoh: { "source": "rocks", "tiers": [...] } atau { "source": "leadership", "max_points": 200 }. Source yang valid: rocks, scorecard, events, leadership.

---

### Parameter Default — Skema Tutor

| Nama | Input Type | Config |
|---|---|---|
| Training | per_unit | {"weight": 100} |
| Townhall | per_unit | {"weight": 200} |
| Try Out | tiered | {"tiers": [{"min":550,"points":150},{"min":500,"points":100},{"min":400,"points":70},{"min":0,"points":0}]} |
| Retention Murid | per_unit | {"weight": 200} |
| Tag Sosmed JS | per_unit | {"weight": 5} |
| Komen Sosmed JS | per_unit | {"weight": 2} |
| Indikator Tambahan 1 | per_unit | {"weight": 0} |
| Indikator Tambahan 2 | per_unit | {"weight": 0} |
| Indikator Tambahan 3 | per_unit | {"weight": 0} |
| Keterlambatan | per_unit | {"weight": -10} |
| Reschedule / Replace | per_unit | {"weight": -50} |

---

### Parameter Default — Skema Manajemen

| Nama | Input Type | Config |
|---|---|---|
| Training Divisi | normalized | {"max_points": 100} |
| Training All Division | per_unit | {"weight": 100} |
| Townhall | per_unit | {"weight": 200} |
| Tryout Bahasa | tiered | {"tiers": [{"min":550,"points":150},{"min":450,"points":100},{"min":350,"points":70},{"min":0,"points":0}]} |
| Post-test Training Divisi | per_unit | {"weight": 150} |
| Post-test Training All Division | per_unit | {"weight": 150} |
| Scorecard | auto | {"source":"scorecard","tiers":[{"min":100,"points":500},{"min":80,"points":400},{"min":60,"points":300},{"min":0,"points":150}]} |
| Rocks / OKR | auto | {"source":"rocks","tiers":[{"min":100,"points":500},{"min":80,"points":400},{"min":60,"points":300},{"min":0,"points":150}]} |
| Leadership Pipeline | auto | {"source":"leadership","max_points":200} |
| Kontribusi Ide | per_unit | {"weight": 50} |

---

### 12A — Konfigurasi Parameter (oleh Leader/HR via UI)

**CRUD:**
- **Create:** HR tambah parameter baru via form di halaman Leaderboard → Konfigurasi. Pilih skema, nama, input_type, lalu isi config via form dinamis
- **Read:** HR lihat semua parameter aktif per skema beserta config-nya
- **Update:** HR edit nama, input_type, dan config kapan saja. Perubahan hanya berlaku untuk entry baru; entry lama tidak terpengaruh kecuali HR trigger Recalculate eksplisit
- **Delete:** HR hapus parameter (soft delete). Entry lama tetap ada di DB tapi tidak terhitung lagi

---

### 12B — Input Poin per Kuartal (oleh Leader/HR)

HR memilih quarter (Q1–Q4) dan tahun, lalu input raw_value per parameter per user. Sistem kalkulasi poin saat simpan.

**CRUD:**
- **Create:** Buka modal Input Poin, pilih quarter, tahun, user, parameter, isi raw_value
- **Read:** Tabel ranking filter by quarter & year
- **Update:** Tidak tersedia dari UI — HR delete entry lama lalu input ulang, atau trigger Recalculate
- **Delete:** Soft delete per entry

---

### 12C — Dashboard & Ranking

**Semua user:**
- Dua tabel terpisah: Leaderboard Tutor dan Leaderboard Manajemen
- Filter by quarter + tahun
- Klik Detail di baris anggota untuk melihat breakdown poin per parameter

**Leader:**
- Tombol Recalculate — hitung ulang semua entry kuartal tertentu dengan config parameter terbaru
- Ada confirmation dialog sebelum eksekusi — tidak bisa dibatalkan

---

### 12D — Penukaran Poin

**CRUD:**
- **Create (HR):** Buat katalog reward (nama, deskripsi, poin dibutuhkan, stok). User/tutor ajukan penukaran poin
- **Read:** HR lihat semua pengajuan, user lihat history penukaran diri sendiri
- **Update:** HR approve/reject pengajuan. Jika approved, poin terpotong otomatis dari saldo kuartal terakhir
- **Delete:** HR hapus reward dari katalog (soft delete)

---

## KETERHUBUNGAN ANTAR MODUL

```
Scorecard merah berulang     → otomatis muncul di Issues
Rocks off-track              → flag di L10 Meeting
L10 Meeting                  → generate To-Do baru
Issues solved                → bisa di-link ke Rock
Leadership Assessment score  → auto-pull ke Leaderboard (source: leadership)
Rocks completion rate        → auto-pull ke Leaderboard (source: rocks)
Scorecard green rate         → auto-pull ke Leaderboard (source: scorecard)
Event attendance             → auto-pull ke Leaderboard (source: events)
```

---

## INTEGRATION ROADMAP (Future)

- Retention murid → API dari ERP eksternal → otomatis jadi auto parameter di Leaderboard
- Parameter lain dari ERP → tinggal tambah config di DB, tidak perlu coding

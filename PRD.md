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

**Deskripsi:** Sistem performance scoring berbasis poin per kuartal. Scope: per team. Skema poin ditentukan otomatis dari `team.type`:
- `type = tutor` → skema **Tutor**
- `type = leadership | departmental | project` → skema **Manajemen**

Semua besaran poin (nilai, threshold, penalti) disimpan di database sebagai config — tidak ada yang di-hardcode. HR bisa ubah kapan saja tanpa coding.

---

### Konsep Inti

**Parameter** = satu item penilaian (misal: "Training Divisi", "Townhall", "Rocks").
Tiap parameter punya:
- `key` — identifier unik (string, misal `training_divisi`)
- `label` — nama tampilan
- `type` — `additive` (poin ditambah) atau `penalty` (poin dikurangi)
- `input_type` — cara input: `tiered` (ambang batas → poin), `per_unit` (jumlah × poin per unit), `normalized` (hadir/tersedia × poin maks), `auto` (tarik dari modul lain)
- `config` — JSON bebas berisi nilai-nilai yang relevan dengan input_type (threshold, poin per unit, poin maks, sumber auto, dll)
- `applies_to` — `all`, `non_clevel`, atau level/role spesifik

**Entry** = satu baris input poin per user per parameter per kuartal.

**Skor kuartal** = jumlah semua poin entry user di kuartal tersebut.

**Best Quarter Score** = skor kuartal tertinggi user sepanjang tahun.

**Annual Total** = jumlah skor Q1+Q2+Q3+Q4.

---

### Parameter Default — Skema Manajemen

Semua nilai di kolom "Config" disimpan di DB, bukan hardcode.

| Key | Label | Input Type | Config (default) | Applies To |
|---|---|---|---|---|
| `training_divisi` | Training Divisi | `normalized` | `{max_points: 100}` | non_clevel |
| `training_all_div` | Training All Division | `per_unit` | `{points_per_unit: 100}` | all |
| `townhall` | Townhall | `per_unit` | `{points_per_unit: 200}` | all |
| `tryout_bahasa` | Tryout Bahasa (TOEFL/IELTS) | `tiered` | `{tiers: [{min: 550, points: 150}, {min: 450, points: 100}, {min: 350, points: 70}, {min: 0, points: 0}]}` | all |
| `posttest_divisi` | Post-test Training Divisi | `per_unit` | `{points_per_unit: 150}` | all |
| `posttest_all_div` | Post-test Training All Division | `per_unit` | `{points_per_unit: 150}` | all |
| `scorecard` | Scorecard | `tiered` | `{tiers: [{min: 100, points: 500}, {min: 80, points: 400}, {min: 60, points: 300}, {min: 0, points: 150}]}` | all |
| `rocks_okr` | Rocks / OKR | `tiered` | `{tiers: [{min: 100, points: 500}, {min: 80, points: 400}, {min: 60, points: 300}, {min: 0, points: 150}]}` | all |
| `leadership_pipeline` | Leadership Pipeline | `normalized` | `{max_points: 200, scale: 5}` | all |
| `kontribusi_ide` | Kontribusi Ide | `per_unit` | `{points_per_unit: 50}` | all |

> `scorecard` dan `rocks_okr` auto-pull dari Modul Scorecard & Rocks jika data tersedia, tapi HR tetap bisa override manual.

---

### Parameter Default — Skema Tutor

| Key | Label | Input Type | Config (default) | Type |
|---|---|---|---|---|
| `training` | Training | `per_unit` | `{points_per_unit: 100}` | additive |
| `townhall` | Townhall | `per_unit` | `{points_per_unit: 200}` | additive |
| `tryout` | Try Out | `per_unit` | `{points_per_unit: 1}` | additive |
| `retention` | Retention Murid | `per_unit` | `{points_per_unit: 50}` | additive |
| `sosmed` | Sosmed | `per_unit` | `{points_per_unit: 10}` | additive |
| `tambahan_1` | Indikator Tambahan 1 | `per_unit` | `{points_per_unit: 0}` | additive |
| `tambahan_2` | Indikator Tambahan 2 | `per_unit` | `{points_per_unit: 0}` | additive |
| `tambahan_3` | Indikator Tambahan 3 | `per_unit` | `{points_per_unit: 0}` | additive |
| `keterlambatan` | Keterlambatan | `per_unit` | `{points_per_unit: 50}` | penalty |
| `reschedule` | Reschedule / Replace | `per_unit` | `{points_per_unit: 25}` | penalty |

---

### 12A — Config Parameter (oleh Leader/HR)

**CRUD:**
- **Read:** HR lihat semua parameter aktif beserta config-nya
- **Update:** HR ubah nilai config (poin per unit, threshold tier, poin maks) kapan saja. Perubahan berlaku untuk entry baru; entry lama tidak terpengaruh kecuali HR trigger recalculate manual
- Tidak ada Create/Delete parameter dari UI — parameter ditambah via seeder/migration jika skema berubah. Ini trade-off Ponytail: extensibility cukup via DB config, bukan UI penuh

---

### 12B — Input Poin per Kuartal (oleh Leader/HR)

Input dilakukan per user per kuartal. Tampilan: tabel dengan satu baris per user, satu kolom per parameter.

**Manajemen — field input per user:**
- Identitas: nama, jabatan, level (C-Level/Leader/Staff) — read-only dari data user
- `training_divisi`: total sesi tersedia + jumlah sesi hadir
- `training_all_div`: jumlah sesi hadir
- `townhall`: jumlah sesi hadir
- `tryout_bahasa`: skor numerik TOEFL atau IELTS (sistem convert ke poin via tiers)
- `posttest_divisi`: jumlah sesi lulus
- `posttest_all_div`: jumlah sesi lulus
- `scorecard`: persentase (auto-pull dari Modul Scorecard, bisa override)
- `rocks_okr`: persentase (auto-pull dari Modul Rocks, bisa override)
- `leadership_pipeline`: nilai 1–5 (auto-pull dari Modul Leadership Assessment, bisa override)
- `kontribusi_ide`: jumlah ide diimplementasikan

**Tutor — field input per tutor:**
- Identitas: nama — read-only dari data user
- Semua parameter sesuai tabel skema Tutor: input angka per parameter

**CRUD:**
- **Create:** Buka form input Q1/Q2/Q3/Q4, pilih tahun, isi data per user. Satu entry per (user, parameter, quarter, year)
- **Read:** Tabel input per kuartal, filter by year & quarter
- **Update:** Edit entry selama kuartal berlangsung
- **Delete:** Soft delete per entry

---

### 12C — Dashboard & Ranking

**Semua user:**
- Lihat skor diri sendiri + posisi ranking di team aktif
- Lihat breakdown poin per parameter kuartal ini

**Leader:**
- Ringkasan kuartal: total anggota, rata-rata poin, poin tertinggi, poin terendah
- Tabel ranking semua anggota: poin Q1–Q4, Best Quarter Score, Best Kuartal, Annual Total
- Best Staff / Best Tutor: user dengan Best Quarter Score tertinggi sepanjang tahun, dengan medali 🥇🥈🥉
- Filter by year & quarter
- Klik user → modal breakdown poin per parameter

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
Leadership Assessment score  → auto-pull ke Leaderboard input (bisa override)
Rocks completion rate        → auto-pull ke Leaderboard input (bisa override)
Scorecard green rate         → auto-pull ke Leaderboard input (bisa override)
Event attendance             → auto-pull ke Leaderboard input (bisa override)
Leaderboard entry approved   → saldo poin user bertambah
Penukaran poin approved      → saldo poin user berkurang
```

---

## INTEGRATION ROADMAP (Future)

- Retention murid → API dari ERP eksternal → otomatis jadi automatic parameter di Leaderboard
- Parameter lain dari ERP → tinggal tambah di Leaderboard config

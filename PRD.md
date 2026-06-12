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
- **Create:** Org admin buat organization, buat team, assign leader ke team. Leader assign member ke team-nya, assign role per user per team
- **Read:** Semua user lihat struktur org, leader lihat detail team-nya
- **Update:** Org admin edit nama org/team. Leader edit member & role di team-nya, pindah member antar team
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

**Deskripsi:** Weekly measurables per user/seat. Tiap metric punya goal, actual, status (green/yellow/red). Scope: per team.

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

**Deskripsi:** Weekly meeting structure (90 menit): Segue, Scorecard review, Rock review, Headlines, To-Do review, IDS, Conclude. Scope: per team.

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

**Deskripsi:** Ranking per role berdasarkan akumulasi poin dari parameter otomatis dan manual. Skor akhir = total poin user / total poin maks role × 100. Scope: per team. Kalau user ada di multiple team, skor terpisah per team sesuai active team context.

### 12A — Leaderboard Config (oleh Leader/HR)

**Automatic Parameters** (read-only, terhubung modul existing):

| Parameter | Sumber Data |
|---|---|
| Rocks completion rate | Modul Rocks |
| Scorecard green rate | Modul Scorecard |
| To-Do completion rate | Modul To-Do |
| Leadership Assessment score | Modul Leadership Assessment (cycle terbaru) |
| Event attendance rate | Modul Event |

**Manual Parameters** (CRUD bebas oleh leader/HR):
- **Create:** Tambah parameter baru (nama, poin maks, assign ke role)
- **Read:** List semua parameter manual
- **Update:** Edit nama, poin maks, role assignment
- **Delete:** Hapus parameter (data historis input tetap tersimpan)

**Sistem Poin:**
- Tiap parameter punya nilai poin maks yang di-config leader
- Skor akhir = total poin user / total poin maks role × 100
- Tambah/hapus parameter baru → semua skor otomatis recalculate
- Comparable antar user dalam role yang sama di team yang sama
- Extensible: parameter baru kapan saja tanpa perlu coding

### 12B — Input Poin Manual (oleh Leader/HR)

**CRUD:**
- **Create:** Pilih user, pilih parameter manual, input nilai/poin, tambah catatan opsional
- **Read:** History input poin per user per parameter
- **Update:** Leader/HR edit input poin (dengan audit log)
- **Delete:** Leader/HR hapus input (soft delete, audit log)

### 12C — Leaderboard View

**CRUD:**
- **Read:**
  - Semua user lihat leaderboard role masing-masing di team aktif
  - Leader lihat semua role di team aktif
  - Klik user → breakdown skor per parameter
  - Filter by periode (quarterly, custom)
- Tidak ada Create/Update/Delete — pure derived data

---

## KETERHUBUNGAN ANTAR MODUL

```
Scorecard merah berulang     → otomatis muncul di Issues
Rocks off-track              → flag di L10 Meeting
L10 Meeting                  → generate To-Do baru
Issues solved                → bisa di-link ke Rock
Leadership Assessment        → feed ke Leaderboard (automatic parameter)
Rocks/Scorecard/To-Do        → feed ke Leaderboard (automatic parameter)
Event attendance             → feed ke Leaderboard (automatic parameter)
Manual input poin            → feed ke Leaderboard (manual parameter)
```

---

## INTEGRATION ROADMAP (Future)

- Retention murid → API dari ERP eksternal → otomatis jadi automatic parameter di Leaderboard
- Parameter lain dari ERP → tinggal tambah di Leaderboard config

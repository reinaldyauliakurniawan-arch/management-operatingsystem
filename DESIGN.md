# DESIGN.md — Management Operating System
## Just Speak English Course
### Stack: React + Tailwind v4 | Style: Apple-inspired + Dark Emerald -> check and use the reusable components

---

## 1. DESIGN PRINCIPLES

- **Receding chrome** — UI menghilang, konten yang bicara. Tidak ada dekorasi yang kompetitif dengan data.
- **Typographic hierarchy** — ukuran dan weight membentuk hierarki, bukan warna. Warna hanya untuk status dan satu aksi utama.
- **Single accent** — satu warna aksi (`primary`). Tidak ada warna kedua untuk interaksi. Konsisten tanpa pengecualian.
- **Whitespace sebagai struktur** — jarak adalah pemisah, bukan border. Jangan takut kosong.
- **Elevation dari border, bukan shadow** — card naik dari background lewat hairline border tipis, bukan box-shadow tebal.
- **Pill untuk aksi utama** — primary button selalu pill. Ini satu-satunya komponen yang pakai radius penuh.
- **Consistent, no one-off** — semua page pakai komponen yang sama. Tidak ada styling ad-hoc.

---

## 2. COLOR TOKENS

### Base (Tailwind v4 — `app.css` di dalam `@theme {}`)

```css
@theme {
  /* Surface */
  --color-surface:              #ffffff;
  --color-surface-subtle:       #f5f5f5;
  --color-surface-raised:       #f0f0f0;
  --color-surface-overlay:      #e8e8e8;

  /* Border */
  --color-border:               #e4e4e4;
  --color-border-strong:        #cccccc;

  /* Text */
  --color-text-primary:         #1a1a1a;
  --color-text-secondary:       #6b6b6b;
  --color-text-muted:           #999999;
  --color-text-inverse:         #ffffff;

  /* Primary — Dark Emerald */
  --color-primary:              #1a5c41;
  --color-primary-hover:        #134d36;
  --color-primary-subtle:       #e8f0ec;
  --color-primary-text:         #1a5c41;

  /* Status */
  --color-success:              #1a5c41;
  --color-success-subtle:       #e8f0ec;
  --color-success-text:         #1a5c41;
  --color-warning:              #92400e;
  --color-warning-subtle:       #fef3c7;
  --color-warning-text:         #78350f;
  --color-error:                #991b1b;
  --color-error-subtle:         #fef2f2;
  --color-error-text:           #991b1b;
  --color-info:                 #1e3a5f;
  --color-info-subtle:          #eff6ff;
  --color-info-text:            #1e3a5f;
}
```

### Filosofi warna

`#1a5c41` adalah dark forest emerald — bukan hijau muda, bukan neon, bukan mint. Ia gelap, tenang, mahal. Hanya muncul pada: primary button, nav item aktif, link aktif, focus ring. Di tempat lain, UI adalah hitam, abu, dan putih.

Status colors juga desaturated dan gelap — tidak ada merah terang, tidak ada kuning neon. Semua tone teredam.

### Penggunaan token

| Token | Dipakai untuk |
|---|---|
| `surface` | Background halaman utama |
| `surface-subtle` | Background sidebar, topbar |
| `surface-raised` | Input background, dropdown |
| `surface-overlay` | Hover row, selected state |
| `border` | Border default semua komponen |
| `border-strong` | Input focused, divider tegas |
| `text-primary` | Semua teks utama |
| `text-secondary` | Label, subtitle, deskripsi |
| `text-muted` | Placeholder, disabled, timestamp |
| `primary` | Primary button, nav aktif, focus ring — dan hanya ini |
| `primary-subtle` | Badge success, highlight background |
| `primary-text` | Teks di atas `primary-subtle` |

---

## 3. TYPOGRAPHY

Font: **Inter** (Google Fonts, variable font)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600&display=swap');

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

| Token | Size | Weight | Line Height | Tracking | Dipakai untuk |
|---|---|---|---|---|---|
| `heading-xl` | 24px / 1.5rem | 600 | 1.25 | `-0.02em` | Page title |
| `heading-lg` | 20px / 1.25rem | 600 | 1.3 | `-0.015em` | Section title, card title besar |
| `heading-md` | 16px / 1rem | 600 | 1.4 | `-0.01em` | Card title, modal title |
| `body-md` | 14px / 0.875rem | 400 | 1.6 | `0` | Body text default |
| `body-sm` | 13px / 0.8125rem | 400 | 1.55 | `0` | Secondary body, table cell |
| `label-md` | 12px / 0.75rem | 500 | 1.4 | `0.02em` | Label, badge, table header, nav group |
| `caption` | 11px / 0.6875rem | 400 | 1.4 | `0.01em` | Timestamp, helper text |

**Aturan typography:**
- Heading selalu weight **600**, tidak pernah 700. 700 terlalu berat, terlihat murahan.
- Heading pakai **negative letter-spacing** (`tracking-tight` di Tailwind). Ini yang memberi kesan mahal.
- Body selalu weight **400**. Emphasis inline pakai weight **500**, bukan bold.
- Weight **500** hanya untuk label dan inline emphasis — tidak untuk heading, tidak untuk button.
- Tidak ada teks uppercase kecuali `label-md` pada nav group dan table header.

---

## 4. SPACING SCALE

```css
@theme {
  --spacing-xs:   4px;
  --spacing-sm:   8px;
  --spacing-md:   12px;
  --spacing-lg:   16px;
  --spacing-xl:   24px;
  --spacing-2xl:  32px;
  --spacing-3xl:  48px;
  --spacing-4xl:  64px;
}
```

Base unit 8px. Semua spacing adalah kelipatan 4px. Jangan gunakan nilai di luar scale ini.

---

## 5. BORDER & RADIUS & SHADOW

```css
@theme {
  /* Radius */
  --radius-xs:   4px;    /* badge, chip kecil */
  --radius-sm:   8px;    /* input, button secondary/ghost/danger */
  --radius-md:   12px;   /* dropdown, tooltip */
  --radius-lg:   18px;   /* card, modal, panel — default semua container */
  --radius-pill: 9999px; /* primary button SAJA */

  /* Shadow — dipakai minimal */
  --shadow-xs:   0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.10);  /* modal dan dropdown saja */
}
```

**Filosofi elevation:**
- Card tidak pakai shadow — naik dari background lewat `border` hairline.
- Shadow hanya untuk elemen yang benar-benar mengambang: modal overlay dan dropdown/popover.
- Jangan pernah pakai shadow pada button, sidebar, topbar, atau badge.

---

## 6. COMPONENT SPECS

---

### Button

**Variants:** `primary` | `secondary` | `ghost` | `danger`
**Sizes:** `sm` | `md` | `lg`

```tsx
<Button variant="primary" size="md">Simpan</Button>
<Button variant="secondary" size="md">Batal</Button>
<Button variant="ghost" size="sm">Lihat</Button>
<Button variant="danger" size="md">Hapus</Button>
```

| Variant | Background | Text | Border | Radius |
|---|---|---|---|---|
| `primary` | `primary` (#1a5c41) | `text-inverse` (#fff) | none | `radius-pill` |
| `secondary` | `surface-raised` | `text-primary` | 1px `border` | `radius-sm` |
| `ghost` | transparent | `text-secondary` | none | `radius-sm` |
| `danger` | `error-subtle` | `error-text` | 1px `error-subtle` | `radius-sm` |

- **Primary hover:** `primary-hover` (#134d36) + `transform: scale(0.97)` — Apple micro-interaction
- **Disabled:** opacity 40%, pointer-events none
- **Size sm:** `px-4 py-1.5 text-[13px]`
- **Size md:** `px-5 py-2 text-sm`
- **Size lg:** `px-6 py-2.5 text-sm`
- Focus ring: `outline: 2px solid primary`, `outline-offset: 2px`
- Danger tidak pakai background `error` penuh — terlalu agresif. Pakai `error-subtle` dengan teks `error-text`.

---

### Input

**Variants:** `default` | `error`
**Sizes:** `sm` | `md`

```tsx
<Input placeholder="Nama lengkap" />
<Input variant="error" helperText="Wajib diisi" />
<Textarea rows={4} placeholder="Deskripsi..." />
<Select options={options} placeholder="Pilih role" />
```

- Background: `surface-raised` (`#f0f0f0`)
- Border: 1px `border` (`#e4e4e4`)
- Border radius: `radius-sm` (8px)
- Padding: `px-3 py-2`
- Font: `body-md` (14px 400)
- Placeholder: `text-muted`
- **Focus:** border `primary`, `box-shadow: 0 0 0 3px rgba(26,92,65,0.12)`
- **Error:** border `error`, helper text `error-text` 12px
- **Transition:** border-color 150ms ease

---

### Card

```tsx
<Card>
  <CardHeader title="Rocks Q3" subtitle="4 rocks aktif" />
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

- Background: `surface` (#ffffff)
- Border: 1px solid `border` (#e4e4e4)
- Border radius: `radius-lg` (18px)
- Shadow: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` (`shadow-sm`)
- Padding: `xl` (24px)
- `CardHeader` border-bottom: 1px `border`
- `CardFooter` border-top: 1px `border`, background `surface-subtle`

---

### Badge

**Variants:** `success` | `warning` | `error` | `info` | `neutral`

```tsx
<Badge variant="success">On Track</Badge>
<Badge variant="warning">At Risk</Badge>
<Badge variant="error">Off Track</Badge>
<Badge variant="info">In Review</Badge>
<Badge variant="neutral">Draft</Badge>
```

| Variant | Background | Text |
|---|---|---|
| `success` | `#e8f0ec` | `#1a5c41` |
| `warning` | `#fef3c7` | `#78350f` |
| `error` | `#fef2f2` | `#991b1b` |
| `info` | `#eff6ff` | `#1e3a5f` |
| `neutral` | `#f0f0f0` | `#6b6b6b` |

- Border radius: `radius-xs` (4px)
- Padding: `px-2 py-0.5`
- Font: `label-md` (12px 500)
- Tidak ada border pada badge — background `subtle` sudah cukup sebagai pembeda

---

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nama</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Reinaldy</TableCell>
      <TableCell><Badge variant="success">On Track</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

- Container: border 1px `border`, radius `radius-lg` (18px), overflow hidden, shadow `shadow-sm`
- Header background: `surface-subtle` (#f5f5f5)
- Header text: `text-secondary`, `label-md` (12px 500), uppercase, `tracking-wider`
- Row border-bottom: 1px `border`
- Row hover: `surface-overlay` (#e8e8e8), transition 100ms
- Cell padding: `px-4 py-3`
- Cell font: `body-sm` (13px 400) `text-primary`

---

### Modal

```tsx
<Modal open={open} onClose={onClose} title="Tambah Rock" size="md">
  <ModalBody>...</ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Batal</Button>
    <Button variant="primary">Simpan</Button>
  </ModalFooter>
</Modal>
```

- Sizes: `sm` 400px | `md` 560px | `lg` 720px
- Border radius: `radius-lg` (18px)
- Shadow: `shadow-lg` — satu-satunya UI selain dropdown yang pakai shadow
- Overlay: `rgba(0,0,0,0.40)` backdrop
- Animation: fade-in (opacity 0→1) + scale (0.97→1.0), 150ms ease-out
- `ModalFooter`: border-top 1px `border`, justify-end, gap `sm` (8px)
- `ModalHeader`: border-bottom 1px `border`, padding `xl`

---

### PageHeader

```tsx
<PageHeader
  title="Rocks"
  subtitle="90-day priorities tim kamu"
  action={<Button variant="primary">+ Tambah Rock</Button>}
/>
```

- Layout: flex, space-between, align-center
- Border-bottom: 1px `border`
- Padding-bottom: `xl` (24px)
- Margin-bottom: `xl` (24px)
- Title: `heading-xl` (24px 600 tracking-tight)
- Subtitle: `body-md` (14px 400) `text-secondary`

---

### Sidebar

```tsx
<Sidebar>
  <TeamSwitcher />
  <NavGroup label="EOS Core">
    <NavItem icon={...} label="Dashboard" href="/dashboard" />
    <NavItem icon={...} label="Rocks" href="/rocks" />
  </NavGroup>
  <NavGroup label="Proprietary">
    <NavItem icon={...} label="Leaderboard" href="/leaderboard" />
  </NavGroup>
  <UserMenu />
</Sidebar>
```

- Width: 240px expanded | 56px collapsed
- Background: `surface-subtle` (#f5f5f5)
- Border-right: 1px `border`
- **Shadow: tidak ada**

**Nav item — default:**
- Padding: `px-3 py-1.5`
- Border radius: `radius-sm` (8px)
- Text: `body-sm` (13px 400) `text-secondary`
- Icon: 16px `text-muted`

**Nav item — active:**
- Background: `primary-subtle` (#e8f0ec)
- Text: `primary-text` (#1a5c41) weight 500
- Left border: 2px solid `primary` (#1a5c41)
- Icon: `primary`
- Padding-left dikurangi 2px untuk kompensasi border kiri

**Nav item — hover:**
- Background: `surface-overlay` (#e8e8e8)
- Text: `text-primary`

**NavGroup label:**
- Font: `label-md` (12px 500) `text-muted`
- Uppercase, `tracking-wider`
- Margin-bottom: `xs` (4px)
- Margin-top: `lg` (16px) — spacing antar group

**TeamSwitcher:**
- Di paling atas sidebar
- Border-bottom: 1px `border`
- Padding: `md` (12px) semua sisi

**UserMenu:**
- Di paling bawah sidebar
- Border-top: 1px `border`
- Padding: `md` (12px) semua sisi
- Nama user: `body-sm` 500 `text-primary`
- Email: `caption` `text-muted`
- Logout: `caption` `text-muted` → hover `error-text`

---

### TopBar

- Height: 48px
- Background: `surface` (#ffffff)
- Border-bottom: 1px `border`
- Shadow: `0 1px 3px rgba(0,0,0,0.06)` ke bawah saja
- Padding horizontal: `xl` (24px)
- Konten: hamburger toggle kiri, active team name tengah/kiri, user avatar kanan (opsional)
- Team name: `body-sm` `text-muted`

---

### Select (native `<select>`)

Semua `<select>` native di form harus pakai class berikut — tidak boleh styled berbeda:

```
bg-[#f0f0f0] border border-[#e4e4e4] rounded-lg px-3 py-2
text-sm text-[#1a1a1a] focus:outline-none
focus:border-[#1a5c41] focus:ring-2 focus:ring-[#1a5c41]/10
transition-colors appearance-none
```

---

## 7. LAYOUT RULES

```
Sidebar:            240px fixed left (collapsed: 56px)
TopBar:             48px fixed top, background surface, border-bottom
Content area:       flex-1, overflow-y auto
Content padding:    24px semua sisi (xl)
Content max-width:  1280px, mx-auto
Section gap:        24px (xl) antar section vertikal
Card gap:           16px (lg) antar card dalam grid
Grid:               12 column, gap lg (16px)
PageHeader:         selalu ada di atas setiap halaman, border-bottom, mb-xl
```

---

## 8. DO & DON'T

**DO:**
- Pakai token warna — tidak pernah hardcode hex langsung di komponen
- Primary button selalu `radius-pill`. Ini non-negotiable
- Heading selalu weight 600, selalu `tracking-tight` (`-0.01em` s/d `-0.02em`)
- Card dan table elevasi dari `border` hairline — bukan shadow
- Shadow hanya untuk modal dan dropdown
- `danger` button pakai `error-subtle` background — bukan `error` penuh
- Status selalu pakai `Badge` dengan variant yang tepat
- Select native selalu pakai class standard yang didefinisikan di spec ini
- Body text 14px weight 400. Tidak ada pengecualian untuk body copy
- Whitespace adalah konten — jangan isi semua ruang kosong

**DON'T:**
- Jangan pakai warna hijau muda, mint, atau neon apapun — primary adalah dark forest emerald
- Jangan buat primary button dengan radius selain pill
- Jangan pakai shadow pada card, button, sidebar, topbar, atau badge
- Jangan mix font weight sembarangan — ladder adalah 400 / 500 / 600
- Jangan pakai weight 700 di mana pun
- Jangan pakai border yang tebal atau kontras — border harus hairline, whisper
- Jangan buat komponen baru kalau komponen yang ada sudah cukup
- Jangan pakai `dark:` class — tidak ada dark mode
- Jangan pakai warna status (`success`, `warning`, `error`) untuk dekorasi — hanya untuk status data nyata
- Jangan pakai `gray-*`, `green-*`, atau warna Tailwind default langsung — selalu lewat token

---

## 9. QUICK REFERENCE — HEX VALUES

Untuk dipakai saat menulis Tailwind class langsung (saat token belum tersedia sebagai class):

| Token | Hex |
|---|---|
| `primary` | `#1a5c41` |
| `primary-hover` | `#134d36` |
| `primary-subtle` | `#e8f0ec` |
| `primary-text` | `#1a5c41` |
| `surface` | `#ffffff` |
| `surface-subtle` | `#f5f5f5` |
| `surface-raised` | `#f0f0f0` |
| `surface-overlay` | `#e8e8e8` |
| `border` | `#e4e4e4` |
| `border-strong` | `#cccccc` |
| `text-primary` | `#1a1a1a` |
| `text-secondary` | `#6b6b6b` |
| `text-muted` | `#999999` |
| `error` | `#991b1b` |
| `error-subtle` | `#fef2f2` |
| `warning` | `#92400e` |
| `warning-subtle` | `#fef3c7` |

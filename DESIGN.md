# DESIGN_SYSTEM.md
## Management Operating System — Just Speak
### Stack: React + Tailwind v4 | Style: Notion-inspired + Emerald

---

## 1. DESIGN PRINCIPLES

- **Clean** — whitespace is content. Jangan takut kosong.
- **Typographic** — hierarki dibentuk oleh ukuran & weight teks, bukan warna.
- **Subtle** — warna hanya untuk status & aksi penting. Default UI abu-abu.
- **Consistent** — semua page pakai komponen yang sama, tidak ada one-off styling.
- **Rounded** — semua container pakai border-radius, tidak ada sudut tajam.
- **Soft** — border tidak boleh kaku, shadow selalu ada pada container.

---

## 2. COLOR TOKENS

### Base (Tailwind v4 CSS variables di `app.css`)

```css
@theme {
  --color-surface:              #ffffff;
  --color-surface-subtle:       #f7f7f6;
  --color-surface-raised:       #f1f1ef;
  --color-surface-overlay:      #ebebea;

  --color-border:               #ebebea;
  --color-border-strong:        #d9d9d6;

  --color-text-primary:         #1a1a19;
  --color-text-secondary:       #6b6b69;
  --color-text-muted:           #9b9b98;
  --color-text-inverse:         #ffffff;

  --color-primary:              #059669;
  --color-primary-hover:        #047857;
  --color-primary-subtle:       #d1fae5;
  --color-primary-text:         #065f46;

  --color-success:              #059669;
  --color-success-subtle:       #d1fae5;
  --color-success-text:         #065f46;
  --color-warning:              #d97706;
  --color-warning-subtle:       #fef3c7;
  --color-warning-text:         #92400e;
  --color-error:                #dc2626;
  --color-error-subtle:         #fee2e2;
  --color-error-text:           #991b1b;
  --color-info:                 #0284c7;
  --color-info-subtle:          #e0f2fe;
  --color-info-text:            #075985;
}
```

### Penggunaan

| Token | Dipakai untuk |
|---|---|
| `surface` | Background halaman utama |
| `surface-subtle` | Background sidebar, header |
| `surface-raised` | Card, dropdown, input background |
| `surface-overlay` | Hover state, selected row |
| `border` | Border default semua komponen |
| `border-strong` | Border focused input, divider tegas |
| `text-primary` | Semua teks utama |
| `text-secondary` | Label, subtitle, deskripsi |
| `text-muted` | Placeholder, disabled, timestamp |
| `primary` | Button primary, link aktif, accent |
| `primary-subtle` | Badge, background highlight emerald |

---

## 3. TYPOGRAPHY SCALE

Font family: **Inter** (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

| Name | Size | Weight | Line Height | Dipakai untuk |
|---|---|---|---|---|
| `heading-xl` | 24px / 1.5rem | 700 | 1.3 | Page title |
| `heading-lg` | 20px / 1.25rem | 600 | 1.4 | Section title |
| `heading-md` | 16px / 1rem | 600 | 1.4 | Card title, modal title |
| `body-md` | 14px / 0.875rem | 400 | 1.6 | Body text default |
| `body-sm` | 13px / 0.8125rem | 400 | 1.6 | Secondary body |
| `label-md` | 12px / 0.75rem | 500 | 1.4 | Label, badge, tab |
| `caption` | 11px / 0.6875rem | 400 | 1.4 | Timestamp, helper text |

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
}
```

---

## 5. BORDER & SHADOW

```css
@theme {
  --radius-sm:   4px;    /* badge only */
  --radius-md:   6px;    /* input, button sm */
  --radius-lg:   8px;    /* button default, dropdown */
  --radius-xl:   12px;   /* card, modal — default semua container */

  --shadow-sm:   0 1px 3px rgba(0,0,0,0.04);   /* subtle, jarang dipakai */
  --shadow-md:   0 2px 8px rgba(0,0,0,0.08);   /* card, panel default */
  --shadow-lg:   0 4px 16px rgba(0,0,0,0.10);  /* modal, dropdown */
}
```

---

## 6. COMPONENT SPECS

### Button

**Variants:** `primary` | `secondary` | `ghost` | `danger`
**Sizes:** `sm` | `md` | `lg`

```tsx
<Button variant="primary" size="md">Save</Button>
<Button variant="secondary" size="md">Cancel</Button>
<Button variant="ghost" size="sm">View</Button>
<Button variant="danger" size="md">Delete</Button>
```

| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | `primary` | `text-inverse` | none |
| `secondary` | `surface-raised` | `text-primary` | `border` |
| `ghost` | transparent | `text-secondary` | none |
| `danger` | `error` | `text-inverse` | none |

- Hover: darken 1 level
- Disabled: opacity 40%
- Border radius: `radius-lg`
- Size sm: px-3 py-1.5 text-sm | md: px-4 py-2 text-sm | lg: px-5 py-2.5 text-base

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

- Background: `surface-raised`
- Border: `border`
- Border radius: `radius-lg`
- Focus: border `primary`, ring `primary` opacity 20%
- Error: border `error`, helper text `error-text`
- Padding: px-3 py-2

---

### Card

```tsx
<Card>
  <CardHeader title="Rocks Q3" subtitle="4 rocks aktif" />
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

- Background: `surface`
- Border: `border`
- Border radius: `radius-xl`
- Shadow: `shadow-md`
- Padding: `xl` (24px)
- CardHeader border-bottom: `border`

---

### Badge

**Variants:** `success` | `warning` | `error` | `info` | `neutral`

```tsx
<Badge variant="success">On Track</Badge>
<Badge variant="error">Off Track</Badge>
<Badge variant="warning">At Risk</Badge>
<Badge variant="info">In Review</Badge>
<Badge variant="neutral">Draft</Badge>
```

- Background: `{variant}-subtle`
- Text: `{variant}-text`
- Border radius: `radius-sm`
- Padding: px-2 py-0.5
- Font: `label-md` (12px 500)

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
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

- Header background: `surface-subtle`
- Header text: `text-secondary`, `label-md`
- Row hover: `surface-overlay`
- Border-bottom tiap row: `border`
- Cell padding: px-4 py-3
- Container: border `border`, radius `radius-xl`, shadow `shadow-md`, overflow hidden

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
- Border radius: `radius-xl`
- Shadow: `shadow-lg`
- Overlay: black 40% opacity
- Animation: fade + scale
- ModalFooter: border-top `border`, justify end, gap sm

---

### PageHeader

```tsx
<PageHeader
  title="Rocks"
  subtitle="90-day priorities tim kamu"
  action={<Button variant="primary">+ Tambah Rock</Button>}
/>
```

- Border-bottom: `border`
- Padding bottom: `xl`
- Margin bottom: `xl`
- Title: `heading-xl`
- Subtitle: `body-md` `text-secondary`

---

### Sidebar

```tsx
<Sidebar>
  <TeamSwitcher />
  <NavItem icon={...} label="Dashboard" href="/dashboard" />
  <NavGroup label="EOS Core">
    <NavItem icon={...} label="Rocks" href="/rocks" />
  </NavGroup>
  <UserMenu />
</Sidebar>
```

- Width: 240px (collapsed: 56px)
- Background: `surface-subtle`
- Border-right: `border`
- Nav item active: background `primary-subtle`, text `primary-text`, left border 2px solid `primary`
- Nav item hover: background `surface-overlay`
- Nav item border radius: `radius-lg`
- NavGroup label: `caption`, `text-muted`, uppercase, tracking-wider
- TeamSwitcher: di atas, border-bottom `border`
- UserMenu: di bawah, border-top `border`

---

## 7. LAYOUT RULES

```
Sidebar:            240px fixed left
Top bar:            48px, background surface, border-bottom border
Content area:       flex-1, padding xl (24px) semua sisi
Content max-width:  1280px
Page padding:       24px (xl) semua sisi
Section gap:        24px (xl) antar section
Card gap:           16px (lg) antar card dalam grid
Grid:               12 column, gap lg
```

---

## 8. DO & DON'T

**DO:**
- Pakai komponen dari design system, jangan buat inline style baru
- Pakai token warna, jangan hardcode hex
- Semua form pakai `Input`, `Select`, `Button` dari komponen library
- Teks utama: `text-primary`. Teks pendukung: `text-secondary`. Placeholder: `text-muted`
- Status selalu pakai `Badge` dengan variant yang tepat
- Semua container (card, modal, table, dropdown) wajib `radius-xl` dan `shadow-md`
- Border selalu pakai `border` token — jangan pakai gray-200 atau sejenisnya langsung

**DON'T:**
- Jangan pakai warna selain token yang sudah didefinisikan
- Jangan buat card tanpa shadow
- Jangan pakai border-radius kurang dari `radius-lg` untuk container
- Jangan mix font weight sembarangan
- Jangan buat komponen baru kalau komponen yang ada sudah cukup
- Jangan pakai border yang terlalu kontras — border harus whisper, bukan tegas

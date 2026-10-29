/**
 * Icon wrapper built on the Phosphor Icons library (https://phosphoricons.com).
 *
 * It keeps the project-wide `<Icon name="…" />` API so callers never import the
 * library directly. `name` is a stable kebab-cased key; `filled` renders the
 * solid Phosphor weight and the old numeric `strokeWidth` maps onto Phosphor's
 * weight scale. A handful of legacy emoji keys are still accepted so data that
 * was seeded before the migration (e.g. inside localStorage) keeps rendering.
 */
import {
  MagnifyingGlass,
  CalendarBlank,
  CalendarPlus,
  CalendarCheck,
  Clock,
  Bell,
  User,
  Users,
  UserPlus,
  SquaresFour,
  ChartBar,
  Stethoscope,
  Buildings,
  ListBullets,
  Check,
  CheckCircle,
  X,
  CaretLeft,
  CaretRight,
  CaretDown,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  Phone,
  EnvelopeSimple,
  MapPin,
  Star,
  Heart,
  Heartbeat,
  Shield,
  Lock,
  Warning,
  WarningCircle,
  Info,
  SignOut,
  Gear,
  Funnel,
  ArrowRight,
  ArrowLeft,
  List,
  ArrowsClockwise,
  DownloadSimple,
  Clipboard,
  ClipboardText,
  Camera,
  Pulse,
  CurrencyDollar,
  TrendUp,
  VideoCamera,
  Chat,
  PaperPlaneTilt,
  Medal,
  BookOpen,
  Briefcase,
  House,
  FacebookLogo,
  TwitterLogo,
  LinkedinLogo,
  InstagramLogo,
  Pill,
  Thermometer,
  Baby,
  Sparkle,
  Brain,
  Bone,
  Tooth,
  Hospital,
  FirstAid,
} from '@phosphor-icons/react'

/** Brand glyphs (Google, GitHub …) drawn as inline SVG so no icon dep is needed. */
function BrandGlyph({ path, size = 20, className, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={path} />
    </svg>
  )
}

const GOOGLE_PATH =
  'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'

const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const GoogleGlyph = (props) => <BrandGlyph {...props} path={GOOGLE_PATH} />
const GitHubGlyph = (props) => <BrandGlyph {...props} path={GITHUB_PATH} />

const ICONS = {
  /* Brand glyphs (not part of Phosphor) — inline SVG paths. */
  google: GoogleGlyph,
  github: GitHubGlyph,
  search: MagnifyingGlass,
  calendar: CalendarBlank,
  'calendar-plus': CalendarPlus,
  'calendar-check': CalendarCheck,
  clock: Clock,
  bell: Bell,
  user: User,
  users: Users,
  'user-plus': UserPlus,
  grid: SquaresFour,
  chart: ChartBar,
  stethoscope: Stethoscope,
  building: Buildings,
  list: ListBullets,
  check: Check,
  'check-circle': CheckCircle,
  x: X,
  'chevron-left': CaretLeft,
  'chevron-right': CaretRight,
  'chevron-down': CaretDown,
  plus: Plus,
  edit: PencilSimple,
  trash: Trash,
  eye: Eye,
  phone: Phone,
  mail: EnvelopeSimple,
  'map-pin': MapPin,
  star: Star,
  heart: Heart,
  heartbeat: Heartbeat,
  shield: Shield,
  lock: Lock,
  'alert-triangle': Warning,
  'alert-circle': WarningCircle,
  info: Info,
  logout: SignOut,
  settings: Gear,
  filter: Funnel,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  menu: List,
  refresh: ArrowsClockwise,
  download: DownloadSimple,
  clipboard: Clipboard,
  'clipboard-text': ClipboardText,
  camera: Camera,
  activity: Pulse,
  dollar: CurrencyDollar,
  'trending-up': TrendUp,
  video: VideoCamera,
  message: Chat,
  send: PaperPlaneTilt,
  award: Medal,
  book: BookOpen,
  briefcase: Briefcase,
  home: House,
  facebook: FacebookLogo,
  twitter: TwitterLogo,
  linkedin: LinkedinLogo,
  instagram: InstagramLogo,
  pill: Pill,
  thermometer: Thermometer,
  // Department specialties.
  baby: Baby,
  sparkle: Sparkle,
  brain: Brain,
  bone: Bone,
  tooth: Tooth,
  hospital: Hospital,
  'first-aid': FirstAid,
  // Legacy emoji keys so previously seeded data still renders.
  '❤️': Heartbeat,
  '🧸': Baby,
  '✨': Sparkle,
  '🧠': Brain,
  '🦴': Bone,
  '🦷': Tooth,
  '👁️': Eye,
  '🩺': Stethoscope,
  '🏥': Hospital,
}

/** Translate the old numeric stroke widths onto Phosphor's weight scale. */
function weightForStroke(strokeWidth) {
  if (strokeWidth == null) return 'regular'
  if (strokeWidth <= 1.4) return 'thin'
  if (strokeWidth <= 1.8) return 'light'
  if (strokeWidth >= 2.4) return 'bold'
  return 'regular'
}

export function Icon({
  name,
  size = 20,
  strokeWidth,
  className = '',
  style,
  filled = false,
  weight,
  ...rest
}) {
  const Glyph = ICONS[name]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      weight={weight || (filled ? 'fill' : weightForStroke(strokeWidth))}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  )
}

export const ICON_NAMES = Object.keys(ICONS)

export default Icon

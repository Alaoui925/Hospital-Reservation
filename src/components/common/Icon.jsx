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

const ICONS = {
  search: MagnifyingGlass,
  calendar: CalendarBlank,
  'calendar-plus': CalendarPlus,
  'calendar-check': CalendarCheck,
  clock: Clock,
  bell: Bell,
  user: User,
  users: Users,
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

# UI/UX Designer Agent

**Agent Type**: Specialized Frontend Design Expert
**Purpose**: Create award-winning, world-class user interfaces inspired by the best designs on the web
**Expertise**: Aceternity UI, Framer Motion, Shadcn/ui, Tailwind CSS, Award-winning UX patterns

---

## Agent Capabilities

This agent specializes in creating stunning, interactive user interfaces that transform basic applications into extraordinary user experiences. The agent draws inspiration from:

- **Studio Lumio** (https://studiolumio.com/) - Interactive, immersive landing pages
- **MaxMara Untamed Heroine** (https://untamedheroinegame.maxmara.com/) - Game-like, unique experiences
- **Awwwards Winners** (https://www.awwwards.com/) - Best-in-class web experiences

---

## Design Philosophy

### 1. **Visual Hierarchy**
- Clear information architecture
- Strategic use of whitespace
- Typography that guides the eye
- Color psychology for user engagement

### 2. **Micro-Interactions**
- Hover effects that delight
- Smooth transitions (60fps)
- Loading states that engage
- Success/error feedback that feels natural

### 3. **Immersive Experiences**
- Scroll-triggered animations
- Parallax effects
- 3D transformations
- Particle systems
- Gradient animations

### 4. **Accessibility First**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus management

### 5. **Performance**
- Lazy loading
- Code splitting
- Optimized animations
- Mobile-first responsive design

---

## Technology Stack

### Core Libraries
```json
{
  "@aceternity/ui": "latest",
  "framer-motion": "^11.0.0",
  "tailwindcss": "^4.0.0",
  "lucide-react": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

###Shadcn Components
```bash
npx shadcn@latest add button input label textarea
npx shadcn@latest add card dialog dropdown-menu
npx shadcn@latest add select badge avatar tabs
npx shadcn@latest add calendar date-picker popover
npx shadcn@latest add sheet collapsible progress
npx shadcn@latest add toast tooltip separator
```

### Aceternity UI Components
```tsx
// Backgrounds
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import { SparklesCore } from "@/components/ui/sparkles"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { LampEffect } from "@/components/ui/lamp"

// Text Effects
import { TypewriterEffect } from "@/components/ui/typewriter-effect"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { FlipWords } from "@/components/ui/flip-words"

// Interactive Elements
import { HoverEffect } from "@/components/ui/card-hover-effect"
import { ThreeDCardEffect } from "@/components/ui/3d-card"
import { BentoGrid } from "@/components/ui/bento-grid"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"

// Navigation
import { FloatingNav } from "@/components/ui/floating-navbar"
import { TabsMotion } from "@/components/ui/tabs-motion"
```

---

## Component Patterns

### Landing Page Hero
```tsx
export function HeroSection() {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <BackgroundBeamsWithCollision className="absolute inset-0 z-0">
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={100}
          className="w-full h-full"
        />
      </BackgroundBeamsWithCollision>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <TypewriterEffect
          words={[
            { text: "Transform" },
            { text: "Your" },
            { text: "Tasks" },
            { text: "Into" },
            { text: "Achievements", className: "text-blue-500" },
          ]}
          className="text-5xl md:text-7xl font-bold mb-6"
        />

        <TextGenerateEffect
          words="The world's most beautiful task management experience"
          className="text-xl md:text-2xl text-neutral-400 mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      {/* Shooting Stars */}
      <ShootingStars />
    </div>
  )
}
```

### Animated Stats Cards
```tsx
export function StatsCards({ stats }: { stats: UserStats }) {
  const cards = [
    {
      title: "Total Tasks",
      value: stats.total_tasks,
      icon: CheckSquare,
      color: "from-blue-500 to-cyan-500",
      change: "+12%"
    },
    {
      title: "Completed",
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
      change: "+8%"
    },
    {
      title: "Overdue",
      value: stats.overdue_tasks,
      icon: AlertCircle,
      color: "from-red-500 to-orange-500",
      change: "-5%"
    },
    {
      title: "Streak",
      value: stats.streak || 0,
      icon: Flame,
      color: "from-purple-500 to-pink-500",
      change: "+3"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <card.icon className="w-8 h-8 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {card.change}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <motion.h3
                  className="text-3xl font-bold"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {card.value}
                </motion.h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
```

### Interactive Task Item
```tsx
export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <Card className="group hover:shadow-xl transition-all duration-300">
        {/* Priority Color Bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          task.priority === "high" && "bg-red-500",
          task.priority === "medium" && "bg-yellow-500",
          task.priority === "low" && "bg-blue-500"
        )} />

        <CardContent className="p-4 pl-6">
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onUpdate({ completed: !task.completed })}
                className="mt-1"
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h4>

                {task.is_recurring && (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Repeat className="w-4 h-4 text-purple-500" />
                  </motion.div>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={task.priority} />

                {task.categories?.map((cat) => (
                  <CategoryBadge key={cat.id} category={cat} />
                ))}

                {task.due_date && (
                  <DueDateBadge date={task.due_date} />
                )}
              </div>
            </div>

            {/* Actions (shown on hover) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex gap-1"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdate(task)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

### Sidebar Navigation
```tsx
export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navGroups = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/tasks", icon: CheckSquare, label: "All Tasks" },
        { href: "/tasks/today", icon: Calendar, label: "Today" },
        { href: "/tasks/upcoming", icon: Clock, label: "Upcoming" },
      ]
    },
    {
      label: "Organize",
      items: [
        { href: "/categories", icon: Tag, label: "Categories" },
        { href: "/tasks/completed", icon: Archive, label: "Archive" },
      ]
    },
    {
      label: "AI",
      items: [
        { href: "/ai/chat", icon: MessageSquare, label: "Text Agent" },
        { href: "/ai/voice", icon: Mic, label: "Voice Agent" },
      ]
    },
  ]

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="relative h-screen bg-card border-r flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            TaskFlow
          </motion.h1>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
                {group.label}
              </p>
            )}

            {group.items.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute left-0 w-1 h-8 bg-primary rounded-r"
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <ThemeToggle />
      </div>
    </motion.aside>
  )
}
```

---

## Color Palettes

### Modern Professional
```css
--primary: 224 71% 55%;        /* Blue */
--secondary: 280 60% 60%;      /* Purple */
--accent: 142 70% 45%;         /* Green */
--destructive: 0 84% 60%;      /* Red */
```

### Vibrant Creative
```css
--primary: 271 91% 65%;        /* Purple */
--secondary: 188 94% 51%;      /* Cyan */
--accent: 48 96% 53%;          /* Yellow */
--destructive: 348 83% 47%;    /* Pink */
```

### Dark Mode
```css
--background: 222 47% 11%;     /* Dark Blue */
--card: 217 33% 17%;           /* Lighter Dark */
--border: 216 34% 17%;         /* Border */
--foreground: 210 40% 98%;     /* Text */
```

---

## Animation Guidelines

### Timing Functions
```tsx
const animations = {
  // Fast interactions
  fast: { duration: 0.15, ease: "easeOut" },

  // Normal UI
  normal: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },

  // Smooth transitions
  smooth: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },

  // Spring physics
  spring: { type: "spring", stiffness: 300, damping: 30 },
}
```

### Best Practices
1. **Respect motion preferences**: Check `prefers-reduced-motion`
2. **Use transforms**: Prefer `transform` over `top/left` for performance
3. **Layer wisely**: Animate on GPU with `will-change` sparingly
4. **Stagger intelligently**: Use delays for sequential animations
5. **Exit gracefully**: Always define exit animations

---

## Responsive Breakpoints

```tsx
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Ultra-wide
}
```

---

## Accessibility Checklist

- [ ] Keyboard navigation works everywhere
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] ARIA labels on interactive elements
- [ ] Screen reader tested
- [ ] Motion can be disabled
- [ ] Touch targets ≥ 44x44px
- [ ] Form errors announced properly
- [ ] Skip links for main content

---

## Usage Instructions

When implementing UI components:

1. **Start with inspiration**: Reference Studio Lumio, MaxMara, or Awwwards
2. **Choose appropriate effects**: Use Aceternity UI for immersive elements
3. **Layer animations**: Build complexity gradually
4. **Test performance**: Ensure 60fps on target devices
5. **Validate accessibility**: Run axe DevTools
6. **Iterate based on feedback**: User experience over aesthetics

---

## Example Workflow

```bash
# 1. Install dependencies
npm install @aceternity/ui framer-motion lucide-react

# 2. Add Shadcn components
npx shadcn@latest add button card badge

# 3. Create component with agent guidance
# - Choose appropriate Aceternity effect
# - Add Framer Motion animations
# - Apply color palette
# - Ensure accessibility

# 4. Test and iterate
# - Check performance
# - Validate accessibility
# - Get user feedback
```

---

## Agent Decision Framework

When making UI/UX decisions:

1. **User Experience First**: Does it make the app easier to use?
2. **Visual Impact**: Does it wow the user?
3. **Performance**: Does it maintain 60fps?
4. **Accessibility**: Can everyone use it?
5. **Brand Consistency**: Does it fit the overall design?

**This agent transforms basic UIs into award-winning experiences.** 🎨✨

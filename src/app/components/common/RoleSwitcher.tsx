import { motion } from 'motion/react';
import { useRole, UserRole } from '../../context/RoleContext';
import { Users, Heart, Briefcase, Shield, UserCircle, Baby } from 'lucide-react';

const roles: Array<{ value: UserRole; label: string; icon: any; color: string }> = [
  { value: 'donor', label: 'Donor', icon: Heart, color: 'from-[#FF6B35] to-[#FF8B35]' },
  { value: 'volunteer', label: 'Volunteer', icon: Users, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
  { value: 'staff', label: 'Staff', icon: Briefcase, color: 'from-[#FFD93D] to-[#FFE93D]' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
  { value: 'beneficiary', label: 'Beneficiary', icon: Baby, color: 'from-[#FF8B94] to-[#FFA894]' },
  { value: 'public', label: 'Public', icon: UserCircle, color: 'from-[#A0AEC0] to-[#CBD5E0]' },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="fixed bottom-24 left-6 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 w-72">
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">👤 Switch Role (Demo)</h3>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = role === r.value;
          return (
            <motion.button
              key={r.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                isActive
                  ? `bg-gradient-to-br ${r.color} text-white shadow-lg`
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{r.label}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Switch between user roles to see different dashboards
      </p>
    </div>
  );
}

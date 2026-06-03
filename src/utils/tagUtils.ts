export const getTagColor = (tag: string, isDark: boolean) => {
  const t = tag.toLowerCase();
  
  if (t.includes("urgent") || t.includes("high") || t.includes("important")) {
    return {
      bg: isDark ? 'rgba(249,115,22,0.1)' : '#ffedd5',
      text: isDark ? '#fdba74' : '#9a3412',
      border: isDark ? 'rgba(249,115,22,0.2)' : '#fed7aa',
    };
  }
  if (t.includes("legal") || t.includes("contract") || t.includes("law")) {
    return {
      bg: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe',
      text: isDark ? '#93c5fd' : '#1e40af',
      border: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe',
    };
  }
  if (t.includes("finance") || t.includes("invoice") || t.includes("paid")) {
    return {
      bg: isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5',
      text: isDark ? '#6ee7b7' : '#065f46',
      border: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0',
    };
  }
  if (t.includes("hr") || t.includes("resume")) {
    return {
      bg: isDark ? 'rgba(168,85,247,0.1)' : '#f3e8ff',
      text: isDark ? '#d8b4fe' : '#6b21a8',
      border: isDark ? 'rgba(168,85,247,0.2)' : '#e9d5ff',
    };
  }

  const colors = [
    {
      bg: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe',
      text: isDark ? '#93c5fd' : '#1e40af',
      border: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe',
    }, // Blue
    {
      bg: isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5',
      text: isDark ? '#6ee7b7' : '#065f46',
      border: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0',
    }, // Emerald
    {
      bg: isDark ? 'rgba(168,85,247,0.1)' : '#f3e8ff',
      text: isDark ? '#d8b4fe' : '#6b21a8',
      border: isDark ? 'rgba(168,85,247,0.2)' : '#e9d5ff',
    }, // Purple
    {
      bg: isDark ? 'rgba(236,72,153,0.1)' : '#fce7f3',
      text: isDark ? '#f9a8d4' : '#9d174d',
      border: isDark ? 'rgba(236,72,153,0.2)' : '#fbcfe8',
    }, // Pink
    {
      bg: isDark ? 'rgba(99,102,241,0.1)' : '#e0e7ff',
      text: isDark ? '#a5b4fc' : '#3730a3',
      border: isDark ? 'rgba(99,102,241,0.2)' : '#c7d2fe',
    }, // Indigo
    {
      bg: isDark ? 'rgba(20,184,166,0.1)' : '#ccfbf1',
      text: isDark ? '#5eead4' : '#115e59',
      border: isDark ? 'rgba(20,184,166,0.2)' : '#99f6e4',
    }, // Teal
  ];

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

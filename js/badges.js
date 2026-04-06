(function (w) {
  var BADGES = [
    {
      id: 1,
      slug: 'fondator',
      label: 'Fondator',
      description: 'Creator al proiectului sau membru din nucleul initial.',
      colors: { base: '#D4A63A', dark: '#8A6217', accent: '#F1CF75' },
      icon: 'crown',
      order: 10
    },
    {
      id: 2,
      slug: 'helper',
      label: 'Helper',
      description: 'Membru care ajuta alti utilizatori.',
      colors: { base: '#2F6DB3', dark: '#1A3E6A', accent: '#74A9E4' },
      icon: 'handshake',
      order: 20
    },
    {
      id: 3,
      slug: 'membru-de-onoare',
      label: 'Membru de onoare',
      description: 'Membru apreciat in mod special.',
      colors: { base: '#6E4BAE', dark: '#3D2868', accent: '#B397E8' },
      icon: 'medal',
      order: 30
    },
    {
      id: 4,
      slug: 'contribuitor',
      label: 'Contribuitor',
      description: 'Membru care adauga continut sau informatii utile.',
      colors: { base: '#2E8B57', dark: '#1A5033', accent: '#6FC893' },
      icon: 'book-feather',
      order: 40
    },
    {
      id: 5,
      slug: 'veteran',
      label: 'Veteran',
      description: 'Membru vechi al comunitatii.',
      colors: { base: '#9C6B30', dark: '#5A3B1A', accent: '#D4A46A' },
      icon: 'clock',
      order: 50
    },
    {
      id: 6,
      slug: 'distinctie-speciala',
      label: 'Distinctie speciala',
      description: 'Acordata pentru merite deosebite.',
      colors: { base: '#8B2E3C', dark: '#501822', accent: '#CB6C7A' },
      icon: 'seal-star',
      order: 60
    },
    {
      id: 7,
      slug: 'om-de-incredere',
      label: 'Om de incredere',
      description: 'Membru serios, respectat si de incredere.',
      colors: { base: '#1F3C68', dark: '#11233E', accent: '#5C86BE' },
      icon: 'check-shield',
      order: 70
    },
    {
      id: 8,
      slug: 'moderator',
      label: 'Moderator',
      description: 'Membru cu rol oficial de moderare.',
      colors: { base: '#7A1F2A', dark: '#441017', accent: '#BA5A67' },
      icon: 'shield-star',
      order: 80
    }
  ];

  var byId = {};
  var bySlug = {};
  BADGES.forEach(function (b) {
    byId[b.id] = b;
    bySlug[b.slug] = b;
  });

  function cloneBadge(b) {
    return b
      ? {
          id: b.id,
          slug: b.slug,
          label: b.label,
          description: b.description,
          colors: {
            base: b.colors.base,
            dark: b.colors.dark,
            accent: b.colors.accent
          },
          icon: b.icon,
          order: b.order
        }
      : null;
  }

  function getById(id) {
    return cloneBadge(byId[Number(id)] || null);
  }

  function getBySlug(slug) {
    return cloneBadge(bySlug[String(slug || '').trim()] || null);
  }

  function all() {
    return BADGES.map(cloneBadge).sort(function (a, b) {
      return (a.order || 999) - (b.order || 999);
    });
  }

  w.CalnicBadges = {
    all: all,
    getById: getById,
    getBySlug: getBySlug,
    byId: byId,
    bySlug: bySlug
  };
})(window);

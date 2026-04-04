(function () {
  'use strict';

  function uniquePush(map, key, value) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }

  function inferFamilyVisibility(family) {
    if (!family) return 'private';
    return family.show_members === false ? 'private' : 'public';
  }

  function normalizeLinkType(rawType) {
    const type = String(rawType || '').toLowerCase();
    if (type === 'blood' || type === 'sange') return 'blood';
    if (type === 'marriage' || type === 'casatorie' || type === 'spouse') return 'marriage';
    if (type === 'alliance' || type === 'alianta' || type === 'in_law') return 'alliance';
    if (type === 'step') return 'alliance';
    if (type === 'adopted') return 'blood';
    if (type === 'distant') return 'distant';
    return type || 'distant';
  }

  function strongerType(a, b) {
    const rank = { blood: 4, marriage: 3, alliance: 2, distant: 1 };
    return (rank[b] || 0) > (rank[a] || 0) ? b : a;
  }

  function buildNodes(families) {
    return (families || []).map(function (family) {
      return {
        id: family.id,
        label: family.display_name || family.name || 'Familie',
        familyName: family.name || family.display_name || 'Familie',
        village: family.village || 'Calnic',
        since: family.since || null,
        visibility: inferFamilyVisibility(family),
        connectedToVillage: !!family.connected_to_village,
        membersCount: family.members_count || 0,
        generationsCount: family.generations_count || 0,
        photosCount: family.photos_count || 0,
        publicUrl: 'genealogie-familie.html?family=' + encodeURIComponent(family.id),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 24,
        raw: family
      };
    });
  }

  function mergeRawLinks(familyLinks, memberRelations, members) {
    const memberToFamily = new Map();
    (members || []).forEach(function (member) {
      if (member && member.id && member.family_id) {
        memberToFamily.set(member.id, member.family_id);
      }
    });

    const merged = new Map();

    (familyLinks || []).forEach(function (link) {
      if (!link || !link.family_a_id || !link.family_b_id || link.family_a_id === link.family_b_id) return;
      const a = String(link.family_a_id);
      const b = String(link.family_b_id);
      const pairKey = a < b ? a + '::' + b : b + '::' + a;
      const type = normalizeLinkType(link.link_type);
      const existing = merged.get(pairKey);
      if (!existing) {
        merged.set(pairKey, {
          id: link.id || pairKey,
          source: a,
          target: b,
          type: type,
          reasons: [{
            source: 'family_links',
            type: type,
            labelRo: type,
            labelEn: type
          }],
          confirmed: !!link.confirmed,
          autoDetected: !!link.auto_detected,
          raw: [link]
        });
      } else {
        existing.type = strongerType(existing.type, type);
        existing.reasons.push({
          source: 'family_links',
          type: type,
          labelRo: type,
          labelEn: type
        });
        existing.raw.push(link);
      }
    });

    (memberRelations || []).forEach(function (rel) {
      if (!rel || !rel.from_member_id || !rel.to_member_id) return;
      const familyA = memberToFamily.get(rel.from_member_id);
      const familyB = memberToFamily.get(rel.to_member_id);
      if (!familyA || !familyB || familyA === familyB) return;
      const a = String(familyA);
      const b = String(familyB);
      const pairKey = a < b ? a + '::' + b : b + '::' + a;
      const rawType = normalizeLinkType(rel.relation_type);
      const type = rawType === 'blood' ? 'blood' : (rawType === 'marriage' ? 'marriage' : 'alliance');
      const existing = merged.get(pairKey);
      if (!existing) {
        merged.set(pairKey, {
          id: rel.id || pairKey,
          source: a,
          target: b,
          type: type,
          reasons: [{
            source: 'member_relations',
            type: type,
            labelRo: rawType,
            labelEn: rawType
          }],
          confirmed: true,
          autoDetected: false,
          raw: [rel]
        });
      } else {
        existing.type = strongerType(existing.type, type);
        existing.reasons.push({
          source: 'member_relations',
          type: type,
          labelRo: rawType,
          labelEn: rawType
        });
        existing.raw.push(rel);
      }
    });

    return Array.from(merged.values());
  }

  async function safeQuery(run) {
    try {
      const res = await run();
      return res && !res.error ? (res.data || []) : [];
    } catch (err) {
      return [];
    }
  }

  async function fetchVillageTreeData() {
    if (!window.supabase || !window.supabase.from) {
      throw new Error('Supabase nu este disponibil.');
    }

    const familiesRes = await window.supabase.from('families').select('*').order('name');
    if (familiesRes.error) throw familiesRes.error;

    const families = familiesRes.data || [];
    const familyLinks = await safeQuery(function () {
      return window.supabase.from('family_links').select('*').order('created_at', { ascending: true });
    });
    const members = await safeQuery(function () {
      return window.supabase.from('members').select('id,family_id,visibility,name').limit(5000);
    });
    const memberRelations = await safeQuery(function () {
      return window.supabase.from('member_relations').select('*').limit(5000);
    });

    const nodes = buildNodes(families);
    const links = mergeRawLinks(familyLinks, memberRelations, members);

    const adjacency = new Map();
    links.forEach(function (link) {
      uniquePush(adjacency, link.source, { nodeId: link.target, link: link });
      uniquePush(adjacency, link.target, { nodeId: link.source, link: link });
    });

    return {
      families: families,
      persons: members,
      relations: memberRelations,
      familyLinks: familyLinks,
      graph: {
        nodes: nodes,
        links: links,
        adjacency: adjacency
      },
      meta: {
        fetchedAt: new Date().toISOString(),
        usedFallbackRelations: !familyLinks.length && !!memberRelations.length
      }
    };
  }

  window.VillageTreeAdapter = {
    fetchVillageTreeData: fetchVillageTreeData,
    inferFamilyVisibility: inferFamilyVisibility,
    normalizeLinkType: normalizeLinkType
  };
})();

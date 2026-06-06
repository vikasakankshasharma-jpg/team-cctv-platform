export function guessCategory(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('camera') || t.includes('bullet') || t.includes('dome') || t.includes('ptz')) return 'camera';
    if (t.includes('dvr') || t.includes('nvr') || t.includes('xvr') || t.includes('recorder')) return 'recorder';
    if (t.includes('hdd') || t.includes('hard drive') || t.includes('ssd') || t.includes('tb ') || t.includes('seagate') || t.includes('wd')) return 'storage';
    if (t.includes('cable') || t.includes('cat6') || t.includes('cat5') || t.includes('wire') || t.includes('bundle') || t.includes('roll') || t.includes('vga') || t.includes('hdmi')) return 'cable';
    if (t.includes('bnc') || t.includes('dc ') || t.includes('rj45') || t.includes('connector') || t.includes('jack') || t.includes('dc pin')) return 'connector';
    if (t.includes('smps') || t.includes('power supply') || t.includes('adapter') || t.includes('poe switch')) return 'power_device';
    if (t.includes('rack') || t.includes('cabinet') || t.includes(' u ') || t.includes('server rack')) return 'rack';
    if (t.includes('monitor') || t.includes('display') || t.includes('screen') || t.includes('tv ') || t.includes('led') || t.includes('lcd')) return 'display';
    if (t.includes('switch') || t.includes('router') || t.includes('media converter') || t.includes('wifi')) return 'network';
    if (t.includes('mount') || t.includes('bracket') || t.includes('box') || t.includes('stand') || t.includes('junction box')) return 'mount';
    if (t.includes('installation') || t.includes('service') || t.includes('labor') || t.includes('fitting') || t.includes('labour')) return 'installation';
    if (t.includes('amc') || t.includes('maintenance')) return 'amc';
    if (t.includes('accessory') || t.includes('mouse') || t.includes('keyboard') || t.includes('mousepad')) return 'accessory';
    return 'unidentified';
}

export function guessBrand(title: string): string | null {
    const t = title.toLowerCase();
    if (t.includes('hikvision')) return 'Hikvision';
    if (t.includes('cp plus') || t.includes('cp-plus') || t.includes('cpplus')) return 'CP Plus';
    if (t.includes('dahua')) return 'Dahua';
    if (t.includes('prama')) return 'Prama';
    if (t.includes('godrej')) return 'Godrej';
    if (t.includes('trueview')) return 'Trueview';
    if (t.includes('consistent')) return 'Consistent';
    if (t.includes('seagate')) return 'Seagate';
    if (t.includes('wd ') || t.includes('western digital') || t.includes('wd purple')) return 'WD';
    if (t.includes('toshiba')) return 'Toshiba';
    if (t.includes('d-link') || t.includes('dlink')) return 'D-Link';
    if (t.includes('tp-link') || t.includes('tplink')) return 'TP-Link';
    if (t.includes('erd')) return 'ERD';
    return null;
}

export function guessTechnologies(title: string): string[] {
    const t = title.toLowerCase();
    const tech = [];
    if (/ip|network/i.test(t)) tech.push('IP');
    if (/hd|analog|tvi|cvi|ahd/i.test(t)) tech.push('Analog');
    if (/colorvu|full color|color|night color/i.test(t)) tech.push('ColorVu');
    if (/two-way|2-way|two way/i.test(t)) {
        tech.push('Two-Way Audio');
    } else if (/audio|mic|built-in/i.test(t)) {
        tech.push('Audio');
    }
    if (/ptz|pan tilt/i.test(t)) {
        tech.push('PTZ');
    } else if (/\bpt\b/i.test(t)) {
        tech.push('PT');
    }
    if (/dome/i.test(t)) tech.push('Dome');
    if (/bullet/i.test(t)) tech.push('Bullet');
    if (/indoor/i.test(t)) tech.push('Indoor');
    if (/outdoor/i.test(t)) tech.push('Outdoor');
    if (/sd card|microsd/i.test(t)) tech.push('SD Card Slot');
    if (/hybrid|tribrid/i.test(t)) tech.push('Hybrid');
    if (/dual light|smart light/i.test(t)) tech.push('Dual Light');
    if (/starlight/i.test(t)) tech.push('Starlight');
    if (/wdr|wide dynamic/i.test(t)) tech.push('WDR');
    if (/wifi|wi-fi|wireless/i.test(t)) tech.push('WiFi');
    if (/4g|lte/i.test(t)) tech.push('4G');
    if (/poe/i.test(t)) tech.push('PoE');

    // Extract power specs
    const voltsMatch = title.match(/\b(\d+(?:\.\d+)?)\s*v\b/i);
    if (voltsMatch) tech.push(`${voltsMatch[1]}V`);
    
    const ampsMatch = title.match(/\b(\d+(?:\.\d+)?)\s*a\b/i);
    if (ampsMatch) tech.push(`${ampsMatch[1]}A`);

    const wattsMatch = title.match(/\b(\d+(?:\.\d+)?)\s*w\b/i);
    if (wattsMatch) tech.push(`${wattsMatch[1]}W`);

    // Resolution fallbacks in technologies
    if (t.includes('1080p') || t.includes('2mp') || t.includes('2.4mp')) tech.push('2MP');
    if (t.includes('3mp')) tech.push('3MP');
    if (t.includes('4mp')) tech.push('4MP');
    if (t.includes('5mp')) tech.push('5MP');
    if (t.includes('8mp') || t.includes('4k')) tech.push('8MP');

    return Array.from(new Set(tech));
}

export function guessResolution(title: string): number | null {
    const t = title.toLowerCase();
    if (t.includes('2.4mp')) return 2.4;
    const match = t.match(/(\d+(?:\.\d+)?)\s*mp/);
    if (match) return parseFloat(match[1]);
    if (t.includes('1080p')) return 2;
    if (t.includes('4k')) return 8;
    return null;
}

export function guessChannels(title: string): number | null {
    const t = title.toLowerCase();
    const match = t.match(/(\d+)\s*(?:ch|channel|port)/);
    return match ? parseInt(match[1]) : null;
}

export function guessRackUHeight(title: string): number | null {
    const t = title.toLowerCase();
    const match = t.match(/(\d+)\s*u\b/);
    return match ? parseInt(match[1]) : null;
}

export function guessCableLength(title: string): number | null {
    const t = title.toLowerCase();
    const match = t.match(/(\d+)\s*(?:m|meter|meters)\b/);
    return match ? parseInt(match[1]) : null;
}

export function guessVoltage(title: string): number | null {
    const match = title.match(/\b(\d+(?:\.\d+)?)\s*v\b/i);
    return match ? parseFloat(match[1]) : null;
}

export function guessAmperage(title: string): number | null {
    const match = title.match(/\b(\d+(?:\.\d+)?)\s*a\b/i);
    return match ? parseFloat(match[1]) : null;
}

export function guessWattage(title: string): number | null {
    const match = title.match(/\b(\d+(?:\.\d+)?)\s*w\b/i);
    return match ? parseFloat(match[1]) : null;
}

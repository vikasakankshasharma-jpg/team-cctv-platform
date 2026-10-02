with open('lib/pricing-engine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const getCapacity = (a: any) => {
    if (a.max_cameras && a.max_cameras > 0) return a.max_cameras;
    const name = (a.technical_name || a.display_name || "").toLowerCase();
    const match = name.match(/(\d+)\s*(ch|port|channels|ports)/i);
    if (match) return parseInt(match[1]);
    return 999; // If unknown, push it to the end
  };"""

replacement = """  const getCapacity = (a: any) => {
    if (a.max_cameras && a.max_cameras > 0) return a.max_cameras;
    const name = (a.technical_name || a.display_name || "").toLowerCase();
    const match = name.match(/(\d+)\s*(-)?\s*(ch|port|channels|ports|camera|cam)s?/i);
    if (match) return parseInt(match[1]);
    return 999; // If unknown, push it to the end
  };"""

if target in content:
    content = content.replace(target, replacement)
    with open('lib/pricing-engine.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")

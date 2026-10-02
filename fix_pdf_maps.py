with open('lib/pdf/quote-pdf.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_items = """          {pricing.items.map((item: any, i: number) => (
            <View key={`item-${i}`} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{item.display_name}</Text>
                <Text style={styles.itemBrand}>Brand: {item.brand || 'TEAM CCTV'}</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{item.qty}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}"""

replacement_items = """          {pricing.items.map((item: any, i: number) => {
            const name = item.display_name || item.name || item.title || "CCTV Component";
            const qty = item.qty || item.quantity || 1;
            const unitPrice = item.unit_price || item.unitPrice || item.price || 0;
            const lineTotal = item.line_total || item.lineTotal || (qty * unitPrice);
            return (
              <View key={`item-${i}`} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{name}</Text>
                  <Text style={styles.itemBrand}>Brand: {item.brand || 'TEAM CCTV'}</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(unitPrice)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(lineTotal)}</Text>
              </View>
            );
          })}"""

target_addons = """          {pricing.addons.map((addon: any, i: number) => (
            <View key={`addon-${i}`} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{addon.display_name}</Text>
                <Text style={styles.itemBrand}>Brand: Add-on</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{addon.qty || 1}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(addon.price)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(addon.price * (addon.qty || 1))}</Text>
            </View>
          ))}"""

replacement_addons = """          {pricing.addons && pricing.addons.map((addon: any, i: number) => {
            const name = addon.display_name || addon.name || "Add-on component";
            const qty = addon.qty || addon.quantity || 1;
            const price = addon.price || addon.unit_price || 0;
            return (
              <View key={`addon-${i}`} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{name}</Text>
                  <Text style={styles.itemBrand}>Brand: Add-on</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(price)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(price * qty)}</Text>
              </View>
            );
          })}"""

if target_items in content:
    content = content.replace(target_items, replacement_items)
if target_addons in content:
    content = content.replace(target_addons, replacement_addons)

with open('lib/pdf/quote-pdf.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")

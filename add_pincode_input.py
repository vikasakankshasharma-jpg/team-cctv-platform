import re

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the insertion point
insertion_point = r"""                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">{t("wz_email_optional")}</label>"""

new_code = r"""                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 302012"
                    value={req.customer_pincode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setReq(prev => ({ ...prev, customer_pincode: val }));
                      if (val.length === 6) {
                        setIsLoadingLocalities(true);
                        fetch(`/api/pincode/${val}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.areas && data.areas.length > 0) {
                              setLocalities(data.areas);
                            } else {
                              setLocalities([]);
                            }
                            if (data.lat && data.lng) {
                              setMapCenter({ lat: data.lat, lng: data.lng });
                            }
                          })
                          .catch(err => console.error("Failed to fetch pincode areas:", err))
                          .finally(() => setIsLoadingLocalities(false));
                      }
                    }}
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white border border-gray-300 rounded-xl text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">{t("wz_email_optional")}</label>"""

if insertion_point in content:
    content = content.replace(insertion_point, new_code)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Insertion point not found")

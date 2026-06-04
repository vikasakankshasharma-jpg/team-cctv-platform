"use strict";
/**
 * @file lib/pricing-engine.ts
 * @description Enterprise-grade pricing engine for TEAM CCTV Platform.
 * Decomposed into modular, testable units with zero-trust server validation.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePricing = calculatePricing;
/**
 * Main entry point for pricing calculation.
 */
function calculatePricing(params) {
    var selection = params.selection, products = params.products, addons = params.addons, settings = params.settings, cablingDone = params.cablingDone, _a = params.cablingMeters, cablingMeters = _a === void 0 ? 50 : _a, _b = params.referralDiscountPercent, referralDiscountPercent = _b === void 0 ? 0 : _b, _c = params.referralDiscountFlat, referralDiscountFlat = _c === void 0 ? 0 : _c, activeOffer = params.activeOffer, _d = params.geoRules, geoRules = _d === void 0 ? [] : _d, locationParams = params.locationParams;
    // Evaluate Geo-Pricing Matrix (Surge > Pincode > City > State)
    var effectiveLaborMultiplier = 1.0;
    var effectiveTravelFee = 0;
    if (geoRules.length > 0 && locationParams) {
        var validRules = geoRules.filter(function (r) {
            var _a, _b;
            if (!r.is_active)
                return false;
            if (r.valid_until && new Date(r.valid_until) < new Date())
                return false;
            if (r.level === "surge")
                return true;
            if (r.level === "pincode" && r.target_value === locationParams.pincode)
                return true;
            if (r.level === "city" && r.target_value.toLowerCase() === ((_a = locationParams.city) === null || _a === void 0 ? void 0 : _a.toLowerCase()))
                return true;
            if (r.level === "state" && r.target_value.toLowerCase() === ((_b = locationParams.state) === null || _b === void 0 ? void 0 : _b.toLowerCase()))
                return true;
            return false;
        });
        if (validRules.length > 0) {
            validRules.sort(function (a, b) { return a.priority - b.priority; });
            var winner = validRules[0];
            if (winner.labor_multiplier !== undefined)
                effectiveLaborMultiplier = winner.labor_multiplier;
            if (winner.flat_travel_fee !== undefined)
                effectiveTravelFee = winner.flat_travel_fee;
        }
    }
    // 0. Industrial Threshold Check
    var isIndustrial = selection.camera_count > (settings.max_supported_cameras || 16);
    // Initialize accumulators
    var baseHardwareCost = 0;
    var totalPurchaseCost = 0;
    var addonsTotal = 0;
    var lineItems = [];
    var quoteAddons = [];
    var marginWarnings = [];
    // 1. Resolve Effective Technology
    var effectiveTech = selection.technology;
    if (selection.selected_camera_id) {
        var cam = products.find(function (p) { return p.id === selection.selected_camera_id; });
        if (cam && (cam.technologies.includes("HD") || cam.technologies.includes("IP"))) {
            effectiveTech = cam.technologies[0]; // Or some logic to determine which one it's acting as
        }
    }
    if (!isIndustrial) {
        // 2. Core Hardware Calculation
        var hardware = calculateHardware(selection, products, addons, settings, effectiveTech);
        lineItems.push.apply(lineItems, hardware.items);
        baseHardwareCost += hardware.totalRetail;
        totalPurchaseCost += hardware.totalCost;
        // 3. Labor & Equipment Calculation
        var labor = calculateLabor(selection, settings, effectiveTech, effectiveLaborMultiplier);
        lineItems.push.apply(lineItems, labor.items);
        baseHardwareCost += labor.totalRetail;
        // Labor purchase cost is usually 0 (internal staff) or a percentage (outsourced)
        totalPurchaseCost += (labor.totalRetail * (settings.labor_cost_margin_percent || 0)) / 100;
        // 3b. Cabling Cost (only if customer hasn't already done cabling)
        if (!cablingDone) {
            var cabling = calculateCabling(selection, settings, effectiveTech, cablingMeters, effectiveLaborMultiplier);
            lineItems.push.apply(lineItems, cabling.items);
            baseHardwareCost += cabling.totalRetail;
            totalPurchaseCost += cabling.totalCost;
        }
        // 3c. Connectors Cost
        var connectors = calculateConnectors(selection, settings, effectiveTech);
        lineItems.push.apply(lineItems, connectors.items);
        baseHardwareCost += connectors.totalRetail;
        totalPurchaseCost += connectors.totalCost;
        // 4. Add-ons & Promotional Calculation
        var addonCalc = calculateAddons({
            selection: selection,
            addons: addons,
            settings: settings,
            baseHardwareCost: baseHardwareCost,
            activeOffer: activeOffer,
            selectedAddonIds: selection.selected_addons || []
        });
        quoteAddons.push.apply(quoteAddons, addonCalc.items);
        addonsTotal += addonCalc.totalRetail;
        totalPurchaseCost += addonCalc.totalCost;
    }
    // 5. Final Financial Aggregation & Taxes
    var grossSubtotal = baseHardwareCost + addonsTotal;
    // Apply Referral Discounts
    var referralDiscount = Math.round(grossSubtotal * (referralDiscountPercent / 100)) + referralDiscountFlat;
    var netTaxableAmount = Math.max(0, grossSubtotal - referralDiscount);
    var gstRate = settings.gst_rate || 18;
    var gstAmount = Math.round(netTaxableAmount * (gstRate / 100));
    var totalPayable = netTaxableAmount + gstAmount;
    // 6. Margin Analysis (Audit)
    var grossProfitValue = netTaxableAmount - totalPurchaseCost;
    var grossProfitPercent = netTaxableAmount > 0 ? (grossProfitValue / netTaxableAmount) * 100 : 0;
    if (settings.minimum_margin_threshold && grossProfitPercent < settings.minimum_margin_threshold) {
        marginWarnings.push("Low Margin Alert: ".concat(grossProfitPercent.toFixed(1), "% (Threshold: ").concat(settings.minimum_margin_threshold, "%)"));
    }
    return {
        plan_type: selection.plan_type,
        technology: effectiveTech,
        items: lineItems,
        addons: quoteAddons,
        base_hardware_cost: Math.round(baseHardwareCost),
        cabling_cost: 0, // Integrated into hardware or labor in this model
        labor_cost: 0, // Integrated into hardware or labor in this model
        addons_total: Math.round(addonsTotal),
        gross_subtotal: Math.round(grossSubtotal),
        referral_discount: referralDiscount,
        net_taxable_amount: Math.round(netTaxableAmount),
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_payable: Math.round(totalPayable),
        requiresIndustrialQuote: isIndustrial,
        total_purchase_cost: Math.round(totalPurchaseCost),
        gross_profit_value: Math.round(grossProfitValue),
        gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
        margin_warnings: marginWarnings
    };
}
/**
 * ──────────────────────────────────────────────────────────────────────────────
 * MODULAR SUB-CALCULATORS
 * ──────────────────────────────────────────────────────────────────────────────
 */
function calculateHardware(selection, products, addons, settings, tech) {
    var items = [];
    var totalRetail = 0;
    var totalCost = 0;
    // 1. Camera Selection
    if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
        for (var _i = 0, _a = selection.mixed_camera_requirements; _i < _a.length; _i++) {
            var req = _a[_i];
            var proxySelection = __assign({}, selection);
            proxySelection.camera_count = req.count;
            if (req.resolution)
                proxySelection.resolution_preference = req.resolution;
            // Inject specific camera override for this bucket, and clear the global one
            // so it doesn't accidentally override mixed buckets.
            if (selection.selected_mixed_camera_ids && selection.selected_mixed_camera_ids[req.type]) {
                proxySelection.selected_camera_id = selection.selected_mixed_camera_ids[req.type];
            }
            else {
                proxySelection.selected_camera_id = undefined;
            }
            var extraFeatures = proxySelection.requested_features ? __spreadArray([], proxySelection.requested_features, true) : [];
            if (req.features && req.features.length > 0) {
                extraFeatures.push.apply(extraFeatures, req.features);
            }
            var typeLower = req.type.toLowerCase();
            if (typeLower.includes("ptz"))
                extraFeatures.push("ptz");
            if (typeLower.includes("solar"))
                extraFeatures.push("solar");
            if (typeLower.includes("4g"))
                extraFeatures.push("4g");
            if (typeLower.includes("audio") || typeLower.includes("speaker") || typeLower.includes("mic"))
                extraFeatures.push("audio");
            if (typeLower.includes("color"))
                extraFeatures.push("color");
            proxySelection.requested_features = extraFeatures;
            var proxyTech = req.technology || tech;
            var camera = resolveCamera(proxySelection, products, addons, settings, proxyTech);
            if (camera) {
                var qty = req.count;
                var unitPrice = resolveUnitPrice(camera, qty);
                var lineTotal = unitPrice * qty;
                var featureLabel = "";
                if (req.features && req.features.length > 0) {
                    var names = req.features.map(function (f) {
                        if (f === "color")
                            return "Color Night Vision";
                        if (f === "audio")
                            return "Audio/Mic";
                        if (f === "ptz")
                            return "PTZ";
                        if (f === "solar")
                            return "Solar";
                        if (f === "4g")
                            return "4G";
                        return f;
                    });
                    featureLabel = " (".concat(names.join(", "), ")");
                }
                items.push({
                    product_id: camera.id,
                    display_name: "".concat(req.type).concat(featureLabel, " - ").concat(camera.display_name),
                    brand: camera.brand,
                    qty: qty,
                    unit_price: unitPrice,
                    line_total: lineTotal
                });
                totalRetail += lineTotal;
                totalCost += (camera.base_cost || 0) * qty;
            }
        }
    }
    else {
        // Standard single camera logic
        var camera = resolveCamera(selection, products, addons, settings, tech);
        if (camera) {
            var qty = selection.camera_count;
            var unitPrice = resolveUnitPrice(camera, qty);
            var lineTotal = unitPrice * qty;
            items.push({
                product_id: camera.id,
                display_name: camera.display_name,
                brand: camera.brand,
                qty: qty,
                unit_price: unitPrice,
                line_total: lineTotal
            });
            totalRetail += lineTotal;
            totalCost += (camera.base_cost || 0) * qty;
        }
    }
    // 2. Recorder Selection
    var recorder = resolveRecorder(selection, products, tech);
    if (recorder) {
        items.push({
            product_id: recorder.id,
            display_name: recorder.display_name,
            brand: recorder.brand,
            qty: 1,
            unit_price: recorder.unit_price,
            line_total: recorder.unit_price
        });
        totalRetail += recorder.unit_price;
        totalCost += (recorder.base_cost || 0);
    }
    // 3. Storage (HDD / SD Card)
    var hdd = resolveHDD(selection, __spreadArray(__spreadArray([], products, true), addons, true), tech);
    if (hdd) {
        var unitPrice = hdd.unit_price || hdd.price || 0;
        // WiFi cameras use 1 SD Card per camera. HDDs are shared (qty 1).
        var nameStr = hdd.display_name.toLowerCase();
        var isSdCard = hdd.storage_type === "Micro SD" || nameStr.includes("sd card") || nameStr.includes("micro sd") || nameStr.includes("memory card");
        var qty = isSdCard ? selection.camera_count : 1;
        items.push({
            product_id: hdd.id,
            display_name: hdd.display_name,
            brand: hdd.brand,
            qty: qty,
            unit_price: unitPrice,
            line_total: unitPrice * qty
        });
        totalRetail += unitPrice * qty;
        totalCost += (hdd.base_cost || 0) * qty;
    }
    // 4. Transmission (PoE/PSU)
    var transmission = resolveTransmission(selection, __spreadArray(__spreadArray([], products, true), addons, true), tech);
    if (transmission) {
        var qty = Math.ceil(selection.camera_count / (transmission.max_cameras || 4));
        var unitPrice = transmission.unit_price || transmission.price || 0;
        items.push({
            product_id: transmission.id,
            display_name: transmission.display_name,
            qty: qty,
            unit_price: unitPrice,
            line_total: unitPrice * qty
        });
        totalRetail += unitPrice * qty;
        totalCost += (transmission.base_cost || 0) * qty;
    }
    return { items: items, totalRetail: totalRetail, totalCost: totalCost };
}
function calculateLabor(selection, settings, tech, locationMultiplier) {
    if (locationMultiplier === void 0) { locationMultiplier = 1.0; }
    var items = [];
    var totalRetail = 0;
    var baseRate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
    var rate = Math.round(baseRate * locationMultiplier);
    var qty = selection.camera_count;
    var lineTotal = rate * qty;
    items.push({
        product_id: "labor_install",
        display_name: "Standard ".concat(tech, " Installation & Termination").concat(locationMultiplier !== 1.0 ? " (\u00D7".concat(locationMultiplier, " local rate)") : ""),
        qty: qty,
        unit_price: rate,
        line_total: lineTotal
    });
    totalRetail += lineTotal;
    // Note: High Reach Fee is no longer automatically added.
    // Instead, a UI warning is shown so installers can quote it post-visit.
    return { items: items, totalRetail: totalRetail };
}
function calculateCabling(selection, settings, tech, meters, locationMultiplier) {
    if (locationMultiplier === void 0) { locationMultiplier = 1.0; }
    var items = [];
    if (tech === "WiFi") {
        return { items: items, totalRetail: 0, totalCost: 0 };
    }
    // Exclude Wireless/Solar/4G cameras from cabling meter counts
    var wiredCameraCount = selection.camera_count;
    if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
        wiredCameraCount = selection.mixed_camera_requirements
            .filter(function (req) {
            var t = req.type.toLowerCase();
            return !t.includes("solar") && !t.includes("4g") && !t.includes("wifi") && !t.includes("wireless");
        })
            .reduce(function (sum, req) { return sum + req.count; }, 0);
    }
    if (wiredCameraCount <= 0) {
        return { items: items, totalRetail: 0, totalCost: 0 };
    }
    // Use explicitly requested meters per camera, or default to 20m per wired camera
    var metersPerCamera = selection.cable_length_meters || 20;
    var totalMeters = metersPerCamera * wiredCameraCount;
    // Base Cable Cost
    var baseCostPerMeter = 12; // fallback
    var cableTypeLabel = "Cable";
    if (tech === "IP") {
        // IP always uses CAT6
        baseCostPerMeter = settings.cable_copper_coated_ip || 12;
        cableTypeLabel = "CAT6 Cable";
    }
    else {
        // HD can use CAT6 or 3+1 Coaxial
        if (selection.cable_type === "cat6") {
            baseCostPerMeter = settings.cable_copper_coated_ip || 12;
            cableTypeLabel = "CAT6 Cable";
        }
        else {
            // Default to Coaxial for HD
            baseCostPerMeter = settings.cable_copper_coated_hd || 8;
            cableTypeLabel = "3+1 Coaxial Cable";
        }
    }
    // Conduit Cost Addition
    var isConduit = selection.wiring_type === "conduit";
    if (isConduit) {
        var conduitRate = settings.conduit_cost_per_meter || 20;
        baseCostPerMeter += conduitRate;
    }
    var ratePerMeter = Math.round(baseCostPerMeter * locationMultiplier);
    var lineTotal = ratePerMeter * totalMeters;
    var typeLabel = isConduit ? "Conduit Pipe + ".concat(cableTypeLabel) : "".concat(cableTypeLabel, " (Open)");
    items.push({
        product_id: "cabling_material",
        display_name: "".concat(typeLabel, " (~").concat(totalMeters, "m) @ \u20B9").concat(ratePerMeter, "/m"),
        qty: totalMeters,
        unit_price: ratePerMeter,
        line_total: lineTotal
    });
    // Purchase cost = ~70% of retail (material has lower margin)
    var totalCost = Math.round(lineTotal * 0.7);
    return { items: items, totalRetail: lineTotal, totalCost: totalCost };
}
function calculateConnectors(selection, settings, tech) {
    var items = [];
    if (tech === "WiFi") {
        return { items: items, totalRetail: 0, totalCost: 0 };
    }
    var cameraCount = selection.camera_count || 1;
    var useRJ45 = tech === "IP" || selection.cable_type === "cat6";
    if (useRJ45) {
        var rate = settings.connector_rj45_cost || 25;
        var lineTotal = rate * cameraCount;
        items.push({
            product_id: "connector_rj45",
            display_name: "RJ45 Connectors (Camera & Switch/Balun ends)",
            qty: cameraCount,
            unit_price: rate,
            line_total: lineTotal
        });
        return { items: items, totalRetail: lineTotal, totalCost: Math.round(lineTotal * 0.5) };
    }
    else {
        var rate = settings.connector_bnc_dc_cost || 70;
        var lineTotal = rate * cameraCount;
        items.push({
            product_id: "connector_bnc_dc",
            display_name: "BNC & DC Connector Set",
            qty: cameraCount,
            unit_price: rate,
            line_total: lineTotal
        });
        return { items: items, totalRetail: lineTotal, totalCost: Math.round(lineTotal * 0.5) };
    }
}
function calculateAddons(params) {
    var selection = params.selection, addons = params.addons, settings = params.settings, baseHardwareCost = params.baseHardwareCost, activeOffer = params.activeOffer, selectedAddonIds = params.selectedAddonIds;
    var items = [];
    var totalRetail = 0;
    var totalCost = 0;
    // BUG FIX: Skip `amc_1yr` here — it is handled dynamically below
    // to avoid double-counting (price is % of hardware, not a fixed price).
    var staticAddonIds = selectedAddonIds.filter(function (id) { return id !== "amc_1yr"; });
    staticAddonIds.forEach(function (id) {
        var addon = addons.find(function (a) { return a.id === id; });
        if (!addon)
            return;
        var qty = 1;
        if (addon.unit_multiplier === "camera_count")
            qty = selection.camera_count;
        var price = addon.price || 0;
        var lineTotal = price * qty;
        items.push({
            addon_id: addon.id,
            display_name: addon.display_name,
            price: price,
            qty: qty
        });
        totalRetail += lineTotal;
        totalCost += (addon.base_cost || 0) * qty;
    });
    // Dynamic AMC Logic (only runs once, price is % of hardware)
    if (selectedAddonIds.includes("amc_1yr")) {
        var pct = settings.amc_1yr_pct || 15;
        var amcPrice = Math.round(baseHardwareCost * (pct / 100));
        if ((activeOffer === null || activeOffer === void 0 ? void 0 : activeOffer.type) === "free_amc") {
            // Show both lines so customer sees the saving
            items.push({
                addon_id: "amc_1yr",
                display_name: "1-Year Annual Maintenance Contract (".concat(pct, "%)"),
                price: amcPrice,
                qty: 1
            });
            items.push({
                addon_id: "promo_free_amc",
                display_name: "Promotion: Free 1st Year AMC",
                price: -amcPrice,
                qty: 1
            });
            // Net zero — no change to totalRetail
        }
        else {
            items.push({
                addon_id: "amc_1yr",
                display_name: "1-Year Annual Maintenance Contract (".concat(pct, "%)"),
                price: amcPrice,
                qty: 1
            });
            totalRetail += amcPrice;
        }
        // AMC purchase cost ≈ 30% of retail (technician visits)
        totalCost += Math.round(amcPrice * 0.3);
    }
    return { items: items, totalRetail: totalRetail, totalCost: totalCost };
}
/**
 * ──────────────────────────────────────────────────────────────────────────────
 * RESOLUTION HELPERS (PURE FUNCTIONS)
 * ──────────────────────────────────────────────────────────────────────────────
 */
/**
 * Forward-estimates the total quote value for a specific camera to allow budget filtering
 */
function estimateQuoteTotal(cam, selection, products, addons, settings, tech) {
    var qty = selection.camera_count;
    var camTotal = resolveUnitPrice(cam, qty) * qty;
    var recorder = resolveRecorder(selection, products, tech);
    var recTotal = recorder ? recorder.unit_price : 0;
    var hdd = resolveHDD(selection, __spreadArray(__spreadArray([], products, true), addons, true), tech);
    var hddTotal = hdd ? (hdd.unit_price || hdd.price || 0) : 0;
    var transmission = resolveTransmission(selection, __spreadArray(__spreadArray([], products, true), addons, true), tech);
    var transQty = transmission ? Math.ceil(qty / (transmission.max_cameras || 4)) : 0;
    var transTotal = transmission ? (transmission.unit_price || transmission.price || 0) * transQty : 0;
    var baseHardware = camTotal + recTotal + hddTotal + transTotal;
    var laborRate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
    var laborTotal = laborRate * qty;
    var cableMeters = 50; // default estimated average used in engine
    var cableRate = tech === "IP" ? (settings.cable_copper_coated_ip || 12) : (settings.cable_copper_coated_hd || 8);
    var cableTotal = cableRate * (cableMeters * qty);
    var amcTotal = 0;
    if ((selection.selected_addons || []).includes("amc_1yr")) {
        var pct = settings.amc_1yr_pct || 15;
        amcTotal = Math.round(baseHardware * (pct / 100));
    }
    var grossSubtotal = baseHardware + laborTotal + cableTotal + amcTotal;
    var gstAmount = Math.round(grossSubtotal * ((settings.gst_rate || 18) / 100));
    return grossSubtotal + gstAmount;
}
function resolveCamera(selection, products, addons, settings, tech) {
    var _a;
    if (selection.selected_camera_id) {
        return products.find(function (p) { return p.id === selection.selected_camera_id; });
    }
    var pool = products.filter(function (p) { return p.category === "camera" && p.technologies.includes(tech) && p.is_active; });
    // ── Specialty Camera Guardrail ──────────────────────────────
    // Prevent Elite/Premium tiers from accidentally picking highly expensive PTZ/Solar/4G/Wireless cameras
    // unless the customer explicitly requested them.
    var requestedSpecialties = (selection.requested_features || []).map(function (f) { return f.toLowerCase().trim(); });
    var hasSpecialtyRequest = requestedSpecialties.some(function (rf) {
        return ["ptz", "solar", "4g", "wireless", "panoramic"].includes(rf);
    }) || (selection.type && ["ptz", "solar", "4g", "wireless"].some(function (t) { return selection.type.toLowerCase().includes(t); }));
    if (!hasSpecialtyRequest) {
        var nonSpecialtyPool = pool.filter(function (cam) {
            var name = (cam.technical_name + " " + cam.display_name).toLowerCase();
            var feats = (cam.features || []).map(function (f) { return f.toLowerCase(); });
            var isSpecialty = ["ptz", "solar", "4g", "wireless", "panoramic"].some(function (sp) { return name.includes(sp) || feats.includes(sp); });
            return !isSpecialty;
        });
        // Fallback: only apply if it doesn't empty the pool
        if (nonSpecialtyPool.length > 0) {
            pool = nonSpecialtyPool;
        }
    }
    // Filter by Brand
    if (selection.brand_preference && selection.brand_preference !== "all") {
        var brandFiltered = pool.filter(function (cam) { var _a, _b; return ((_a = cam.brand) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === ((_b = selection.brand_preference) === null || _b === void 0 ? void 0 : _b.toLowerCase()); });
        // Fallback: If strict brand matching eliminates ALL cameras, drop the filter
        if (brandFiltered.length > 0) {
            pool = brandFiltered;
        }
    }
    // Filter by Resolution (Megapixel)
    if (selection.resolution_preference && selection.resolution_preference !== "all") {
        // We expect resolution_preference to be something like "2MP" or "4MP"
        var resPref_1 = selection.resolution_preference.toUpperCase();
        var resFiltered = pool.filter(function (cam) {
            // Safely parse resolution_mp (which might be "2MP", "2.4MP", "4MP", etc.)
            var camRes = String(cam.resolution_mp || "").toUpperCase();
            return camRes.includes(resPref_1) || resPref_1.includes(camRes.replace("MP", ""));
        });
        // Fallback: If strict resolution matching eliminates ALL cameras, drop the filter
        if (resFiltered.length > 0) {
            pool = resFiltered;
        }
    }
    // Filter by features
    if ((_a = selection.requested_features) === null || _a === void 0 ? void 0 : _a.length) {
        var filteredPool = pool.filter(function (cam) {
            var feats = (cam.features || []).map(function (f) { return f.toLowerCase().trim(); });
            return selection.requested_features.every(function (rf) { return feats.includes(rf.toLowerCase().trim()); });
        });
        // Fallback: If strict feature matching eliminates ALL cameras, 
        // drop the filter so we don't return an invalid (camera-less) quote.
        if (filteredPool.length > 0) {
            pool = filteredPool;
        }
    }
    // Filter by Max Budget (Total Quote Value Forward-Estimation)
    if (selection.max_budget) {
        var budgetFiltered = pool.filter(function (cam) {
            var predictedTotal = estimateQuoteTotal(cam, selection, products, addons, settings, tech);
            return predictedTotal <= selection.max_budget;
        });
        // Fallback: If strict budget matching eliminates ALL cameras, keep the cheapest camera available
        if (budgetFiltered.length > 0) {
            pool = budgetFiltered;
        }
        else {
            // If budget is impossibly low, we sort by price and just take the absolute cheapest one
            pool.sort(function (a, b) { return a.unit_price - b.unit_price; });
            pool = [pool[0]];
        }
    }
    // Always sort ascending by price for deterministic results
    pool.sort(function (a, b) { return a.unit_price - b.unit_price; });
    if (pool.length === 0)
        return undefined;
    // Use explicit option number if provided (1, 2, 3)
    // But wait, CompareCards relies on 1,2,3 to mean Budget, Recommended, Premium!
    if (selection.selected_camera_option) {
        var opt = selection.selected_camera_option;
        if (opt === 1 || selection.plan_type === "budget") {
            // 1. Budget: Absolute lowest price
            return pool[0];
        }
        else if (opt === 3 || selection.plan_type === "premium") {
            // 3. Premium/Elite: Absolute highest price / highest specification
            return pool[pool.length - 1];
        }
        else {
            // 2. Recommended / Smart Choice
            if (pool.length <= 2)
                return pool[pool.length - 1];
            var medianIdx = Math.floor(pool.length / 2);
            var medianPrice_1 = pool[medianIdx].unit_price;
            // ── Focus Product (Silent Margin Boost) ─────────────────
            // Find active focus products (is_focus_product === true AND unexpired)
            var now_1 = new Date().toISOString();
            var focusProducts = pool.filter(function (cam) {
                if (!cam.is_focus_product)
                    return false;
                // Check expiration if set
                if (cam.focus_active_until && typeof cam.focus_active_until === 'string') {
                    if (now_1 > cam.focus_active_until)
                        return false;
                }
                // Guardrail: Only boost if price is within ±30% of median
                // This prevents forcing an ₹80,000 8MP camera when the median is ₹20,000
                var isWithinBudgetGuardrail = cam.unit_price >= (medianPrice_1 * 0.7) && cam.unit_price <= (medianPrice_1 * 1.3);
                return isWithinBudgetGuardrail;
            });
            if (focusProducts.length > 0) {
                // Sort by boost priority (highest first)
                focusProducts.sort(function (a, b) { return (b.focus_boost_priority || 50) - (a.focus_boost_priority || 50); });
                return focusProducts[0];
            }
            // ── Fallback Property-Aware Logic ───────────────────────
            var propStr = String(selection.property_type);
            if (propStr === "factory" || propStr === "warehouse" || propStr === "office" || propStr === "shop") {
                // Find a high-spec camera near the 60th-80th percentile
                // Prioritize cameras with 4MP+, audio, or PTZ
                var highSpec = pool.slice(Math.floor(pool.length / 2)).find(function (cam) {
                    var feats = (cam.features || []).join(" ").toLowerCase();
                    var name = (cam.technical_name || "").toLowerCase();
                    return feats.includes("mic") || feats.includes("audio") ||
                        feats.includes("ptz") || name.includes("4mp") || name.includes("5mp") || name.includes("8mp");
                });
                return highSpec || pool[Math.floor(pool.length * 0.7)]; // Fallback to 70th percentile
            }
            else {
                // Residential (home, bungalow) -> Median price / solid value
                return pool[medianIdx];
            }
        }
    }
    // Fallback to plan_type if option number is not provided (should not happen with new logic, but safe)
    if (selection.plan_type === "budget") {
        return pool[0];
    }
    else if (selection.plan_type === "premium") {
        return pool[pool.length - 1];
    }
    else {
        return pool[Math.floor(pool.length / 2)];
    }
}
function resolveRecorder(selection, products, tech) {
    if (selection.selected_recorder_id) {
        if (selection.selected_recorder_id === "none")
            return undefined;
        return products.find(function (p) { return p.id === selection.selected_recorder_id; });
    }
    if (tech === "WiFi")
        return undefined; // WiFi cameras generally use SD Cards and no DVR/NVR
    var recorders = products.filter(function (p) {
        return p.category === "recorder" &&
            p.technologies.includes(tech) &&
            (p.max_cameras || p.channels || 0) >= selection.camera_count;
    });
    recorders.sort(function (a, b) { return (a.max_cameras || 0) - (b.max_cameras || 0); });
    return recorders[0];
}
/** Safely resolves storage capacity in TB from a product.
 *  Prefers the dedicated `storage_tb` field, falls back to name parsing.
 */
function resolveHDDCapacity(product) {
    if (typeof product.storage_tb === "number" && product.storage_tb > 0) {
        return product.storage_tb;
    }
    // Fallback: extract first number from name (e.g. "Seagate 2TB HDD" → 2)
    var match = (product.technical_name || product.display_name || "").match(/(\d+(?:\.\d+)?)\s*TB/i);
    if (match)
        return parseFloat(match[1]);
    // Last resort: any leading number
    var numMatch = (product.technical_name || product.display_name || "").match(/^(\d+)/);
    return numMatch ? parseFloat(numMatch[1]) : 0;
}
function resolveHDD(selection, addons, tech) {
    var _a;
    if (selection.selected_storage_id) {
        if (selection.selected_storage_id === "none")
            return undefined; // Explicit no-storage request
        return addons.find(function (a) { return a.id === selection.selected_storage_id; });
    }
    var recordingDays = (_a = selection.recording_days) !== null && _a !== void 0 ? _a : 7;
    if (recordingDays === 0)
        return undefined;
    var hdds = addons.filter(function (a) { return a.category === "storage"; });
    if (hdds.length === 0)
        return undefined;
    if (tech === "WiFi") {
        var sdCards = hdds.filter(function (a) {
            var name = a.display_name.toLowerCase();
            return a.storage_type === "Micro SD" || name.includes("sd card") || name.includes("micro sd") || name.includes("memory card");
        });
        if (sdCards.length > 0) {
            sdCards.sort(function (a, b) { return resolveHDDCapacity(a) - resolveHDDCapacity(b); });
            var requiredGb_1 = recordingDays > 7 ? 128 : 64;
            return sdCards.find(function (s) {
                var tb = resolveHDDCapacity(s);
                var gb = tb >= 1 ? tb * 1000 : tb; // Rough heuristic since some are listed as 64GB
                return gb >= requiredGb_1 || s.display_name.includes("".concat(requiredGb_1, "GB"));
            }) || sdCards[sdCards.length - 1];
        }
        return undefined;
    }
    // Use product's declared daily_gb_per_camera if available, else sensible defaults
    var gbPerDay = tech === "IP" ? 15 : 10;
    var requiredGB = selection.camera_count * gbPerDay * recordingDays;
    var requiredTB = requiredGB / 1000;
    var hardDisks = hdds.filter(function (a) {
        var name = a.display_name.toLowerCase();
        return !(a.storage_type === "Micro SD" || name.includes("sd card") || name.includes("micro sd") || name.includes("memory card"));
    });
    if (hardDisks.length === 0)
        return undefined;
    hardDisks.sort(function (a, b) { return resolveHDDCapacity(a) - resolveHDDCapacity(b); });
    return hardDisks.find(function (h) { return resolveHDDCapacity(h) >= requiredTB; }) || hardDisks[hardDisks.length - 1];
}
function resolveTransmission(selection, addons, tech) {
    if (selection.selected_power_id) {
        return addons.find(function (a) { return a.id === selection.selected_power_id; });
    }
    var keyword = tech === "IP" ? "poe" : "psu";
    var options = addons.filter(function (a) { return a.category === "power_device" && (a.technical_name || a.display_name || "").toLowerCase().includes(keyword); });
    if (options.length === 0)
        return undefined;
    options.sort(function (a, b) { return (a.max_cameras || 0) - (b.max_cameras || 0); });
    return options.find(function (o) { return (o.max_cameras || 0) >= selection.camera_count; }) || options[options.length - 1];
}
function resolveUnitPrice(product, qty) {
    if (product.bulk_discount_threshold && qty >= product.bulk_discount_threshold) {
        return product.bulk_unit_price || product.unit_price || 0;
    }
    return product.unit_price || 0;
}

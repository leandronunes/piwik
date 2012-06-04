window.UserCountryMap = {};

UserCountryMap.run = function(config) {

    var map = $K.map('#UserCountryMap_map'),
        main = $('#UserCountryMap_container'),
        width = main.width();

    window.__userCountryMap = map;

    function updateMap(svgUrl, callback) {
        map.loadMap(config.svgBasePath + svgUrl, function() {
            var ratio, w, h;

            map.clear();

            ratio = map.viewAB.width / map.viewAB.height;
            w = map.container.width();
            h = w / ratio;
            map.container.height(h-2);
            map.resize(w, h);

            callback();

        }, { padding: -3});
    }

    function renderCountryMap(iso) {
        UserCountryMap.lastSelected = iso;
        updateMap(iso + '.svg', function() {
            // add background
            map.addLayer({ id: 'context', key: 'iso' });
            map.addLayer({ id: "regions", className: "regionBG" });
            map.addLayer({ id: 'regions', key: 'fips' });

            // add click events for surrounding countries
            map.onLayerEvent('click', function(path) {
                renderCountryMap(path.iso);
            }, 'context');

            map.addSymbols({
                data: map.getLayer('context').getPathsData(),
                type: $K.Label,
                filter: function(data) { return data.iso != iso; },
                location: function(data) { return 'context.'+data.iso; },
                text: function(data) { return data.iso; },
                'class': 'countryLabel'
            });


            map.tooltips({
                layer: 'regions',
                content: function(id, path) {
                    return [id, path.name];
                }
            });

        });
    }

    function renderWorldMap(target, metric) {

        function updateColors() {
            var metric = $('#userCountryMapSelectMetrics').val();
            // create color scale
            colscale = new chroma.ColorScale({
                colors: ['#CDDAEF', '#385993'],
                limits: chroma.limits(UserCountryMap.countryData, 'k', 8, metric)
            });

            // apply colors to map
            map.choropleth({
                layer: 'countries',
                data: UserCountryMap.countryData,
                key: 'iso',
                colors: function(d, e) {
                    if (d === null) {
                        // console.log(d, e);
                        return '#eee';
                    } else {
                        return colscale.getColor(d[metric]);
                    }
               }
            });
        }

        if (target == UserCountryMap.lastSelected) {
            updateColors();
            return;
        }

        UserCountryMap.lastSelected = target;

        updateMap(target + '.svg', function() {

            map.addLayer({ id: 'countries', className: 'context', filter: function(pd) {
                return UserCountryMap.countriesByIso[pd.iso] === undefined;
            }});

            map.addLayer({ id: 'countries', className: 'countryBG', filter: function(pd) {
                return UserCountryMap.countriesByIso[pd.iso] !== undefined;
            }});

            map.addLayer({ id: 'countries', key: 'iso', filter: function(pd) {
                return UserCountryMap.countriesByIso[pd.iso] !== undefined;
            }});

            map.onLayerEvent('click', function(path) {
                renderCountryMap(path.iso);
            }, 'countries');

            updateColors();
        });
    }

    $.getJSON(config.countryDataUrl, function(report) {

        var metrics = $('#userCountryMapSelectMetrics option');

        var countryData = [], countrySelect = $('#userCountryMapSelectCountry'),
            countriesByIso = {};
        $.each(report.reportData, function(i, data) {
            var meta = report.reportMetadata[i],
                country = {
                    name: data.label,
                    iso: UserCountryMap.ISO2toISO3[meta.code.toUpperCase()],
                    flag: meta.logo
                };
            $.each(metrics, function(i, metric) {
                metric = $(metric).attr('value');
                country[metric] = data[metric];
            });
            countryData.push(country);
            countriesByIso[country.iso] = country;
        });

        countryData.sort(function(a,b) { return a.name > b.name ? 1 : -1; });

        function update(target) {
            if (t.length == 3) {
                renderCountryMap(target);
            } else {
                renderWorldMap(ttarget);
            }
        }


        UserCountryMap.countryData = countryData;
        UserCountryMap.countriesByIso = countriesByIso;

        map.loadStyles(config.mapCssPath, function() {
            $('#UserCountryMap_content .loadingPiwik').hide();
            renderWorldMap('EU');

            function updateState(id) {
                $('#userCountryMapSelectCountry').val(id);
                if (id.length == 3) {
                    renderCountryMap(id);
                } else {
                    renderWorldMap(id);
                }
            }

            // populate country select
            $.each(countryData, function(i, country) {
                countrySelect.append('<option value="'+country.iso+'">'+country.name+'</option>');
            });
            countrySelect.change(function() {
                updateState(countrySelect.val());
            });

            // enable zoom-out
            $('#UserCountryMap-btn-zoom').click(function() {
                var t = UserCountryMap.lastSelected;
                if (t.length == 2) renderWorldMap('world');
                else if (t.length == 3) {
                    if (UserCountryMap.ISO3toCONT[t] !== undefined) {
                        renderWorldMap(UserCountryMap.ISO3toCONT[t]);
                    } else {
                        renderWorldMap('world');
                    }
                }
            });

            // enable mertic changes
            $('#userCountryMapSelectMetrics').change(function() {
                updateState(UserCountryMap.lastSelected);
            });
        });
    });


    $('#UserCountryMap_overlay').hover(function() {
        $('#UserCountryMap_overlay').hide();
    });

};


UserCountryMap.ISO2toISO3 = {"BD": "BGD", "BE": "BEL", "BF": "BFA", "BG": "BGR", "BA": "BIH", "BB": "BRB", "WF": "WLF", "BL": "BLM", "BM": "BMU", "BN": "BRN", "BO": "BOL", "BH": "BHR", "BI": "BDI", "BJ": "BEN", "BT": "BTN", "JM": "JAM", "BV": "BVT", "BW": "BWA", "WS": "WSM", "BQ": "BES", "BR": "BRA", "BS": "BHS", "JE": "JEY", "BY": "BLR", "BZ": "BLZ", "RU": "RUS", "RW": "RWA", "RS": "SRB", "TL": "TLS", "RE": "REU", "TM": "TKM", "TJ": "TJK", "RO": "ROU", "TK": "TKL", "GW": "GNB", "GU": "GUM", "GT": "GTM", "GS": "SGS", "GR": "GRC", "GQ": "GNQ", "GP": "GLP", "JP": "JPN", "GY": "GUY", "GG": "GGY", "GF": "GUF", "GE": "GEO", "GD": "GRD", "GB": "GBR", "GA": "GAB", "SV": "SLV", "GN": "GIN", "GM": "GMB", "GL": "GRL", "GI": "GIB", "GH": "GHA", "OM": "OMN", "TN": "TUN", "JO": "JOR", "HR": "HRV", "HT": "HTI", "HU": "HUN", "HK": "HKG", "HN": "HND", "HM": "HMD", "VE": "VEN", "PR": "PRI", "PS": "PSE", "PW": "PLW", "PT": "PRT", "SJ": "SJM", "PY": "PRY", "IQ": "IRQ", "PA": "PAN", "PF": "PYF", "PG": "PNG", "PE": "PER", "PK": "PAK", "PH": "PHL", "PN": "PCN", "PL": "POL", "PM": "SPM", "ZM": "ZMB", "EH": "ESH", "EE": "EST", "EG": "EGY", "ZA": "ZAF", "EC": "ECU", "IT": "ITA", "VN": "VNM", "SB": "SLB", "ET": "ETH", "SO": "SOM", "ZW": "ZWE", "SA": "SAU", "ES": "ESP", "ER": "ERI", "ME": "MNE", "MD": "MDA", "MG": "MDG", "MF": "MAF", "MA": "MAR", "MC": "MCO", "UZ": "UZB", "MM": "MMR", "ML": "MLI", "MO": "MAC", "MN": "MNG", "MH": "MHL", "MK": "MKD", "MU": "MUS", "MT": "MLT", "MW": "MWI", "MV": "MDV", "MQ": "MTQ", "MP": "MNP", "MS": "MSR", "MR": "MRT", "IM": "IMN", "UG": "UGA", "TZ": "TZA", "MY": "MYS", "MX": "MEX", "IL": "ISR", "FR": "FRA", "IO": "IOT", "SH": "SHN", "FI": "FIN", "FJ": "FJI", "FK": "FLK", "FM": "FSM", "FO": "FRO", "NI": "NIC", "NL": "NLD", "NO": "NOR", "NA": "NAM", "VU": "VUT", "NC": "NCL", "NE": "NER", "NF": "NFK", "NG": "NGA", "NZ": "NZL", "NP": "NPL", "NR": "NRU", "NU": "NIU", "CK": "COK", "XK": "XKX", "CI": "CIV", "CH": "CHE", "CO": "COL", "CN": "CHN", "CM": "CMR", "CL": "CHL", "CC": "CCK", "CA": "CAN", "CG": "COG", "CF": "CAF", "CD": "COD", "CZ": "CZE", "CY": "CYP", "CX": "CXR", "CS": "SCG", "CR": "CRI", "CW": "CUW", "CV": "CPV", "CU": "CUB", "SZ": "SWZ", "SY": "SYR", "SX": "SXM", "KG": "KGZ", "KE": "KEN", "SS": "SSD", "SR": "SUR", "KI": "KIR", "KH": "KHM", "KN": "KNA", "KM": "COM", "ST": "STP", "SK": "SVK", "KR": "KOR", "SI": "SVN", "KP": "PRK", "KW": "KWT", "SN": "SEN", "SM": "SMR", "SL": "SLE", "SC": "SYC", "KZ": "KAZ", "KY": "CYM", "SG": "SGP", "SE": "SWE", "SD": "SDN", "DO": "DOM", "DM": "DMA", "DJ": "DJI", "DK": "DNK", "VG": "VGB", "DE": "DEU", "YE": "YEM", "DZ": "DZA", "US": "USA", "UY": "URY", "YT": "MYT", "UM": "UMI", "LB": "LBN", "LC": "LCA", "LA": "LAO", "TV": "TUV", "TW": "TWN", "TT": "TTO", "TR": "TUR", "LK": "LKA", "LI": "LIE", "LV": "LVA", "TO": "TON", "LT": "LTU", "LU": "LUX", "LR": "LBR", "LS": "LSO", "TH": "THA", "TF": "ATF", "TG": "TGO", "TD": "TCD", "TC": "TCA", "LY": "LBY", "VA": "VAT", "VC": "VCT", "AE": "ARE", "AD": "AND", "AG": "ATG", "AF": "AFG", "AI": "AIA", "VI": "VIR", "IS": "ISL", "IR": "IRN", "AM": "ARM", "AL": "ALB", "AO": "AGO", "AN": "ANT", "AQ": "ATA", "AS": "ASM", "AR": "ARG", "AU": "AUS", "AT": "AUT", "AW": "ABW", "IN": "IND", "AX": "ALA", "AZ": "AZE", "IE": "IRL", "ID": "IDN", "UA": "UKR", "QA": "QAT", "MZ": "MOZ"};
UserCountryMap.ISO3toCONT = {"AGO": "AF", "DZA": "AF", "EGY": "AF", "BGD": "AS", "NER": "AF", "LIE": "EU", "NAM": "AF", "BGR": "EU", "BOL": "SA", "GHA": "AF", "CCK": "AS", "PAK": "AS", "CPV": "AF", "JOR": "AS", "LBR": "AF", "LBY": "AF", "MYS": "AS", "DOM": "NA", "PRI": "NA", "SXM": "NA", "PRK": "AS", "PSE": "AS", "TZA": "AF", "BWA": "AF", "KHM": "AS", "UMI": "OC", "NIC": "NA", "TTO": "NA", "ETH": "AF", "PRY": "SA", "HKG": "AS", "SAU": "AS", "LBN": "AS", "SVN": "EU", "BFA": "AF", "CHE": "EU", "MRT": "AF", "HRV": "EU", "CHL": "SA", "CHN": "AS", "KNA": "NA", "SLE": "AF", "JAM": "NA", "SMR": "EU", "GIB": "EU", "DJI": "AF", "GIN": "AF", "FIN": "EU", "URY": "SA", "THA": "AS", "STP": "AF", "SYC": "AF", "NPL": "AS", "CXR": "AS", "LAO": "AS", "YEM": "AS", "BVT": "AN", "ZAF": "AF", "KIR": "OC", "PHL": "AS", "ROU": "EU", "VIR": "NA", "SYR": "AS", "MAC": "AS", "MAF": "NA", "MLT": "EU", "KAZ": "AS", "TCA": "NA", "PYF": "OC", "NIU": "OC", "DMA": "NA", "BEN": "AF", "GUF": "SA", "BEL": "EU", "MSR": "NA", "TGO": "AF", "DEU": "EU", "GUM": "OC", "LKA": "AS", "SSD": "AF", "FLK": "SA", "GBR": "EU", "BES": "NA", "GUY": "SA", "CRI": "NA", "CMR": "AF", "MAR": "AF", "MNP": "OC", "LSO": "AF", "HUN": "EU", "TKM": "AS", "SUR": "SA", "NLD": "EU", "BMU": "NA", "HMD": "AN", "TCD": "AF", "GEO": "AS", "MNE": "EU", "MNG": "AS", "MHL": "OC", "MTQ": "NA", "BLZ": "NA", "NFK": "OC", "MMR": "AS", "AFG": "AS", "BDI": "AF", "VGB": "NA", "BLR": "EU", "BLM": "NA", "GRD": "NA", "TKL": "OC", "GRC": "EU", "RUS": "EU", "GRL": "NA", "SHN": "AF", "AND": "EU", "MOZ": "AF", "TJK": "AS", "XKX": "EU", "HTI": "NA", "MEX": "NA", "ANT": "NA", "ZWE": "AF", "LCA": "NA", "IND": "AS", "LVA": "EU", "BTN": "AS", "VCT": "NA", "VNM": "AS", "NOR": "EU", "CZE": "EU", "ATF": "AN", "ATG": "NA", "FJI": "OC", "IOT": "AS", "HND": "NA", "MUS": "AF", "ATA": "AN", "LUX": "EU", "ISR": "AS", "FSM": "OC", "PER": "SA", "REU": "AF", "IDN": "AS", "VUT": "OC", "MKD": "EU", "COD": "AF", "COG": "AF", "ISL": "EU", "GLP": "NA", "COK": "OC", "COM": "AF", "COL": "SA", "NGA": "AF", "TLS": "OC", "TWN": "AS", "PRT": "EU", "MDA": "EU", "GGY": "EU", "MDG": "AF", "ECU": "SA", "SEN": "AF", "NZL": "OC", "MDV": "AS", "ASM": "OC", "SPM": "NA", "CUW": "NA", "FRA": "EU", "LTU": "EU", "RWA": "AF", "ZMB": "AF", "GMB": "AF", "WLF": "OC", "JEY": "EU", "FRO": "EU", "GTM": "NA", "DNK": "EU", "IMN": "EU", "AUS": "OC", "AUT": "EU", "SJM": "EU", "VEN": "SA", "PLW": "OC", "KEN": "AF", "MYT": "AF", "WSM": "OC", "TUR": "AS", "ALB": "EU", "OMN": "AS", "TUV": "OC", "ALA": "EU", "BRN": "AS", "TUN": "AF", "PCN": "OC", "BRB": "NA", "BRA": "SA", "CIV": "AF", "SRB": "EU", "GNQ": "AF", "USA": "NA", "QAT": "AS", "SWE": "EU", "AZE": "AS", "GNB": "AF", "SWZ": "AF", "TON": "OC", "CAN": "NA", "UKR": "EU", "KOR": "AS", "AIA": "NA", "CAF": "AF", "SVK": "EU", "CYP": "EU", "BIH": "EU", "SGP": "AS", "SGS": "AN", "SOM": "AF", "UZB": "AS", "ERI": "AF", "POL": "EU", "KWT": "AS", "SCG": "EU", "GAB": "AF", "CYM": "NA", "VAT": "EU", "EST": "EU", "MWI": "AF", "ESP": "EU", "IRQ": "AS", "SLV": "NA", "MLI": "AF", "IRL": "EU", "IRN": "AS", "ABW": "NA", "PNG": "OC", "PAN": "NA", "SDN": "AF", "SLB": "OC", "ESH": "AF", "MCO": "EU", "ITA": "EU", "JPN": "AS", "KGZ": "AS", "UGA": "AF", "NCL": "OC", "ARE": "AS", "ARG": "SA", "BHS": "NA", "BHR": "AS", "ARM": "AS", "NRU": "OC", "CUB": "NA"};

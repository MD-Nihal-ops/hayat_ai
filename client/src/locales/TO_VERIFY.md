# Accessibility translation review

Family First wording and event descriptions need native speaker review:

| Area | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| Family First status, rules-engine questions and notices, source titles and publishers, service labels, event descriptions, family-member controls, missing-information messages, and personal progress labels | See `familyFirst` in `en.json` | See `familyFirst` in `ar.json` | See `familyFirst` in `hi.json` | See `familyFirst` in `ml.json` |
| API-free navigator disclaimer, entity directory labels, source warnings, and three-state progress labels | See `familyFirst` in `en.json` | See `familyFirst` in `ar.json` | See `familyFirst` in `hi.json` | See `familyFirst` in `ml.json` |
| Consent ledger and consent history labels, explanations, decisions, and audit events | See `family` and `consentHistory` in `en.json` | See `family` and `consentHistory` in `ar.json` | See `family` and `consentHistory` in `hi.json` | See `family` and `consentHistory` in `ml.json` |
| Family Circle, caregiver permissions, emergency-only access, read-only overview, and access-ended messages | See `family` in `en.json` | See `family` in `ar.json` | See `family` in `hi.json` | See `family` in `ml.json` |
| Shared care tasks, status filters, claim/release actions, overdue labels, and referral-to-task messaging | See `care`, `home`, and `referrals` in `en.json` | See `care`, `home`, and `referrals` in `ar.json` | See `care`, `home`, and `referrals` in `hi.json` | See `care`, `home`, and `referrals` in `ml.json` |
| Shared doctor questions, asked status, AI translation notice, and translation limits | See `family` in `en.json` | See `family` in `ar.json` | See `family` in `hi.json` | See `family` in `ml.json` |
| Registered medicine lookup labels, source notice, and match statuses | See `reports` in `en.json` | See `reports` in `ar.json` | See `reports` in `hi.json` | See `reports` in `ml.json` |
| Document explanation schema v2, section labels, questions, and Easy Read wording | See `reports` in `en.json` | See `reports` in `ar.json` | See `reports` in `hi.json` | See `reports` in `ml.json` |
| Read-aloud controls, speed labels, playback states, and no-voice messages | See `accessibility.speech` in `en.json` | See `accessibility.speech` in `ar.json` | See `accessibility.speech` in `hi.json` | See `accessibility.speech` in `ml.json` |
| Accessibility settings, page disclosures, and access-needs labels and privacy notices | See `accessibility`, `settings.accessibilitySyncFailed`, and `passport.accessNeeds*` in `en.json` | See matching keys in `ar.json` | See matching keys in `hi.json` | See matching keys in `ml.json` |
| Map/list view controls and accessible health-record chart summaries and range labels | See `map.viewOptions`, `map.mapView`, `map.listView`, and `records.chartSummary`/`records.reportRange` in `en.json` | See matching keys in `ar.json` | See matching keys in `hi.json` | See matching keys in `ml.json` |
| Explore place categories, location search and privacy notices, confidence/source labels, filters, map legend, and chat result actions | See `explore` in `en.json` | See `explore` in `ar.json` | See `explore` in `hi.json` | See `explore` in `ml.json` |
| Chat overhaul, source chips, family context, action confirmations, visit summary, privacy note, and handoff footers | See `chat` in `en.json` | See `chat` in `ar.json` | See `chat` in `hi.json` | See `chat` in `ml.json` |

Government service detail text is supplied in English by the Prompt 1 workbook; translation and clinician/legal review are still needed before translating those claims. The localized rules-engine questions and outcomes, including the child's current UAE location and emirate/jurisdiction prompts, also require native-speaker review.

Wellness and prevention wording needs native speaker review:

| Area | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| Wellness registry cards and link-only notice, manual goals/check-ins, one-day-forgiven streak, family challenge consent/sharing, prevention checklist, chat actions, and access-log labels | See `wellness` in `en.json` | See `wellness` in `ar.json` | See `wellness` in `hi.json` | See `wellness` in `ml.json` |

Hayat Link translation, privacy warnings, verification states, organisation pilot claims, and action labels need native speaker review:

| Area | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| Public appointment message, privacy and verification states, pasted-message explanation, organisation demo form, SMS/email samples, and pilot limits | See `link` and `forOrganisations` in `en.json` | See `link` and `forOrganisations` in `ar.json` | See `link` and `forOrganisations` in `hi.json` | See `link` and `forOrganisations` in `ml.json` |

Provider directory wording needs native speaker review:

| Key | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| navigation.providers | Providers | مقدمو الخدمات | प्रदाता | സേവനദാതാക്കൾ |
| providers.banner | Links to official websites. Hayat AI does not book appointments, show live availability or work with any of these providers. | روابط إلى المواقع الرسمية. لا تحجز Hayat AI المواعيد، ولا تعرض التوافر المباشر، ولا تعمل مع أي من هؤلاء مقدمي الخدمات. | आधिकारिक वेबसाइटों के लिंक। Hayat AI अपॉइंटमेंट बुक नहीं करता, लाइव उपलब्धता नहीं दिखाता और इनमें से किसी प्रदाता के साथ काम नहीं करता। | ഔദ്യോഗിക വെബ്‌സൈറ്റുകളിലേക്കുള്ള ലിങ്കുകൾ. Hayat AI അപ്പോയിന്റ്മെന്റുകൾ ബുക്ക് ചെയ്യുകയോ തത്സമയ ലഭ്യത കാണിക്കുകയോ ഈ സേവനദാതാക്കളിൽ ആരുമായും പ്രവർത്തിക്കുകയോ ചെയ്യുന്നില്ല. |
| providers.searchLabel / searchPlaceholder | Search providers / Name, branch or specialization | البحث عن مقدمي الخدمات / الاسم أو الفرع أو التخصص | प्रदाता खोजें / नाम, शाखा या विशेषज्ञता से खोजें | സേവനദാതാക്കളെ തിരയുക / പേര്, ശാഖ, പ്രത്യേകവിദഗ്ധത എന്നിവ ഉപയോഗിച്ച് തിരയുക |
| providers.kindFilterLabel / kindFilters | Filter by ownership / All / Private / Government / Government-linked | التصفية حسب الملكية / الكل / خاص / حكومي / مرتبط بالحكومة | स्वामित्व से फ़िल्टर करें / सभी / निजी / सरकारी / सरकार से जुड़ा | ഉടമസ്ഥത അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക / എല്ലാം / സ്വകാര്യം / സർക്കാർ / സർക്കാരുമായി ബന്ധപ്പെട്ടത് |
| providers.categoryFilterLabel / categoryFilters | Filter by category / All categories / Groups / Hospitals / Clinics / Pharmacies / Diagnostics / Specialty providers / Other | التصفية حسب الفئة / كل الفئات / مجموعات / مستشفيات / عيادات / صيدليات / تشخيص ومختبرات / مقدمو رعاية تخصصية / أخرى | श्रेणी से फ़िल्टर करें / सभी श्रेणियाँ / समूह / अस्पताल / क्लीनिक / फ़ार्मेसी / जाँच सेवाएँ / विशेषज्ञ प्रदाता / अन्य | വിഭാഗം അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക / എല്ലാ വിഭാഗങ്ങളും / ഗ്രൂപ്പുകൾ / ആശുപത്രികൾ / ക്ലിനിക്കുകൾ / ഫാർമസികൾ / ഡയഗ്നോസ്റ്റിക്സ് / പ്രത്യേക സേവനദാതാക്കൾ / മറ്റുള്ളവ |
| providers.noResults | No providers match your search. | لا يوجد مقدمو خدمات يطابقون بحثك. | आपकी खोज से मेल खाने वाला कोई प्रदाता नहीं है। | നിങ്ങളുടെ തിരയലുമായി പൊരുത്തപ്പെടുന്ന സേവനദാതാക്കളില്ല. |
| providerDetail.back / notFound / aboutTitle | Back to providers / Provider not found / About | العودة إلى مقدمي الخدمات / لم يتم العثور على مقدم الخدمة / نبذة | प्रदाताओं पर वापस जाएँ / प्रदाता नहीं मिला / परिचय | സേവനദാതാക്കളിലേക്ക് മടങ്ങുക / സേവനദാതാവിനെ കണ്ടെത്താനായില്ല / വിവരം |
| providerDetail.aboutTemplate | {name} is listed as a {kind} {category}. Main areas: {specializations}. | يُدرج {name} بصفته مقدمًا {kind} ضمن فئة {category}. المجالات الرئيسية: {specializations}. | {name} को {kind} {category} के रूप में सूचीबद्ध किया गया है। मुख्य क्षेत्र: {specializations}। | {name} {kind} {category} ആയി പട്ടികപ്പെടുത്തിയിരിക്കുന്നു. പ്രധാന മേഖലകൾ: {specializations}. |
| providerDetail.specializations / branches / noBranches | Specializations / Branches and facilities / No branches or facilities listed. | التخصصات / الفروع والمرافق / لا توجد فروع أو مرافق مدرجة. | विशेषज्ञताएँ / शाखाएँ और सुविधाएँ / कोई शाखा या सुविधा सूचीबद्ध नहीं है। | പ്രത്യേകവിദഗ്ധതകൾ / ശാഖകളും സ്ഥാപനങ്ങളും / ശാഖകളോ സ്ഥാപനങ്ങളോ പട്ടികപ്പെടുത്തിയിട്ടില്ല. |
| providerDetail.visitWebsite / websiteNotVerified / call / phoneNotVerified | Visit website / Website not added or not verified yet. / Call / Phone number not verified yet. Check the official website. | زيارة الموقع الإلكتروني / الموقع الإلكتروني غير مضاف أو لم يتم التحقق منه بعد. / اتصل / لم يتم التحقق من رقم الهاتف بعد. تحقق من الموقع الرسمي. | वेबसाइट पर जाएँ / वेबसाइट जोड़ी नहीं गई है या अभी सत्यापित नहीं है। / कॉल करें / फ़ोन नंबर अभी सत्यापित नहीं है। आधिकारिक वेबसाइट देखें। | വെബ്‌സൈറ്റ് സന്ദർശിക്കുക / വെബ്‌സൈറ്റ് ചേർത്തിട്ടില്ല അല്ലെങ്കിൽ ഇതുവരെ പരിശോധിച്ചിട്ടില്ല. / വിളിക്കുക / ഫോൺ നമ്പർ ഇതുവരെ പരിശോധിച്ചിട്ടില്ല. ഔദ്യോഗിക വെബ്‌സൈറ്റ് പരിശോധിക്കുക. |
| providerDetail.openGoogleMaps / mapCaveat / findOnHayatMap | Open in Google Maps / Opens Google Maps in a new tab. Not an exact location. / Find on Hayat map | فتح في خرائط Google / يفتح خرائط Google في علامة تبويب جديدة. الموقع غير دقيق. / البحث في خريطة Hayat | Google Maps में खोलें / Google Maps नए टैब में खुलेगा। यह सटीक स्थान नहीं है। / Hayat मैप पर खोजें | Google Maps-ൽ തുറക്കുക / Google Maps പുതിയ ടാബിൽ തുറക്കും. ഇത് കൃത്യമായ സ്ഥലം അല്ല. / Hayat മാപ്പിൽ കണ്ടെത്തുക |
| providerDetail.dataStatus / lastChecked / notChecked | Data status: {status} / Last checked: {date} / Not checked | حالة البيانات: {status} / آخر تحقق: {date} / لم يتم التحقق | डेटा स्थिति: {status} / अंतिम जाँच: {date} / जाँच नहीं हुई | ഡാറ്റയുടെ നില: {status} / അവസാനം പരിശോധിച്ചത്: {date} / പരിശോധിച്ചിട്ടില്ല |
| providerDetail.fixedNote | Information comes from a directory file and may be out of date. Always confirm with the provider. Hayat AI does not book appointments and is not affiliated with this provider. | المعلومات من ملف دليل وقد تكون قديمة. تحقق دائمًا مع مقدم الخدمة. لا تحجز Hayat AI المواعيد ولا تنتسب إلى مقدم الخدمة هذا. | जानकारी एक निर्देशिका फ़ाइल से है और पुरानी हो सकती है। प्रदाता से हमेशा पुष्टि करें। Hayat AI अपॉइंटमेंट बुक नहीं करता और इस प्रदाता से संबद्ध नहीं है। | വിവരങ്ങൾ ഒരു ഡയറക്ടറി ഫയലിൽ നിന്നുള്ളതാണ്; കാലഹരണപ്പെട്ടിരിക്കാം. സേവനദാതാവുമായി എല്ലായ്പ്പോഴും സ്ഥിരീകരിക്കുക. Hayat AI അപ്പോയിന്റ്മെന്റുകൾ ബുക്ക് ചെയ്യില്ല; ഈ സേവനദാതാവുമായി ബന്ധമുള്ളതുമല്ല. |
| map.groupNameSuggest / viewProvider / chat.groupNotAffiliated / chat.viewProvider | Name suggests: {provider}. Not confirmed. / View provider details / Not affiliated with Hayat AI. / View details | الاسم يشير إلى: {provider}. لم يتم التأكد. / عرض تفاصيل مقدم الخدمة / لا توجد أي جهة تابعة لـ Hayat AI. / عرض التفاصيل | नाम से {provider} का संकेत मिलता है। पुष्टि नहीं हुई है। / प्रदाता का विवरण देखें / Hayat AI का इनसे कोई संबंध नहीं है। / विवरण देखें | പേര് {provider} ആണെന്ന് സൂചിപ്പിക്കുന്നു. സ്ഥിരീകരിച്ചിട്ടില്ല. / സേവനദാതാവിന്റെ വിശദാംശങ്ങൾ കാണുക / Hayat AI-യുമായി ബന്ധമുള്ളതല്ല. / വിശദാംശങ്ങൾ കാണുക |
| about.sources.providerDirectory | Provider directory: compiled from a researched file, checked by hand against official sites where marked, with the date last checked. Not an endorsement. | دليل مقدمي الخدمات: جُمِع من ملف بحثي، وتم التحقق يدويًا من المواقع الرسمية حيثما وُضع ذلك، مع تاريخ آخر تحقق. لا يعني تأييدًا. | प्रदाता निर्देशिका: शोध की गई फ़ाइल से तैयार की गई है, जहाँ चिह्नित है वहाँ आधिकारिक साइटों से हाथ से जाँची गई है और अंतिम जाँच की तारीख दी गई है। यह समर्थन नहीं है। | സേവനദാതാക്കളുടെ ഡയറക്ടറി: ഗവേഷണം ചെയ്ത ഫയലിൽ നിന്ന് തയ്യാറാക്കിയതാണ്; അടയാളപ്പെടുത്തിയിടത്ത് ഔദ്യോഗിക സൈറ്റുകളുമായി കൈകൊണ്ട് പരിശോധിക്കുകയും അവസാന പരിശോധനാ തീയതി ചേർക്കുകയും ചെയ്തിട്ടുണ്ട്. ഇത് അംഗീകാരമല്ല. |

Health Records wording needs native speaker review:

| Key | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| navigation.records / home.actions.records | Health records | السجلات الصحية | स्वास्थ्य रिकॉर्ड | ആരോഗ്യ രേഖകൾ |
| reports.testDate | Date of test | تاريخ الفحص | जाँच की तारीख | പരിശോധന തീയതി |
| home.healthSnapshot / viewHealthRecords / noHealthMetrics | Health snapshot / View health records / Confirmed readings will appear here. | ملخص الصحة / عرض السجلات الصحية / ستظهر القراءات المؤكدة هنا. | स्वास्थ्य झलक / स्वास्थ्य रिकॉर्ड देखें / पुष्टि की गई रीडिंग यहाँ दिखाई देंगी। | ആരോഗ്യ സംഗ്രഹം / ആരോഗ്യ രേഖകൾ കാണുക / സ്ഥിരീകരിച്ച റീഡിംഗുകൾ ഇവിടെ കാണിക്കും. |
| records.title / loading | Health records / Loading health records... | السجلات الصحية / جارٍ تحميل السجلات الصحية... | स्वास्थ्य रिकॉर्ड / स्वास्थ्य रिकॉर्ड लोड हो रहे हैं... | ആരോഗ്യ രേഖകൾ / ആരോഗ്യ രേഖകൾ ലോഡ് ചെയ്യുന്നു... |
| records.addReading / save / saving / cancel | Add a reading / Save reading / Saving... / Cancel | إضافة قراءة / حفظ القراءة / جارٍ الحفظ... / إلغاء | रीडिंग जोड़ें / रीडिंग सहेजें / सहेजा जा रहा है... / रद्द करें | ഒരു റീഡിംഗ് ചേർക്കുക / റീഡിംഗ് സംരക്ഷിക്കുക / സംരക്ഷിക്കുന്നു... / റദ്ദാക്കുക |
| records.metric / value / systolic / diastolic / unit / date | Metric / Value / Systolic / Diastolic / Unit / Date | المؤشر / القيمة / الانقباضي / الانبساطي / الوحدة / التاريخ | माप / मान / सिस्टोलिक / डायस्टोलिक / इकाई / तारीख | അളവ് / മൂല്യം / സിസ്റ്റോളിക് / ഡയസ്റ്റോളിക് / യൂണിറ്റ് / തീയതി |
| records.categories | Blood / Heart and blood pressure / Sugar / Cholesterol / Body | الدم / القلب وضغط الدم / السكر / الكوليسترول / الجسم | रक्त / हृदय और रक्तचाप / शर्करा / कोलेस्ट्रॉल / शरीर | രക്തം / ഹൃദയവും രക്തസമ്മർദ്ദവും / പഞ്ചസാര / കൊളസ്‌ട്രോൾ / ശരീരം |
| records.metrics.hemoglobin / creatinine / wbc / rbc / platelets | Hemoglobin / Creatinine / White blood cells / Red blood cells / Platelets | الهيموغلوبين / الكرياتينين / خلايا الدم البيضاء / خلايا الدم الحمراء / الصفائح الدموية | हीमोग्लोबिन / क्रिएटिनिन / श्वेत रक्त कोशिकाएँ / लाल रक्त कोशिकाएँ / प्लेटलेट्स | ഹീമോഗ്ലോബിൻ / ക്രിയാറ്റിനിൻ / വെളുത്ത രക്താണുക്കൾ / ചുവന്ന രക്താണുക്കൾ / പ്ലേറ്റ്ലെറ്റുകൾ |
| records.metrics.blood_pressure / heart_rate / glucose / hba1c | Blood pressure / Heart rate / Glucose / HbA1c | ضغط الدم / معدل ضربات القلب / الجلوكوز / الهيموغلوبين السكري HbA1c | रक्तचाप / हृदय गति / ग्लूकोज़ / HbA1c | രക്തസമ്മർദ്ദം / ഹൃദയമിടിപ്പ് / ഗ്ലൂക്കോസ് / HbA1c |
| records.metrics.cholesterol_total / ldl / hdl / triglycerides / weight | Total cholesterol / LDL cholesterol / HDL cholesterol / Triglycerides / Weight | الكوليسترول الكلي / كوليسترول LDL / كوليسترول HDL / الدهون الثلاثية / الوزن | कुल कोलेस्ट्रॉल / LDL कोलेस्ट्रॉल / HDL कोलेस्ट्रॉल / ट्राइग्लिसराइड्स / वज़न | മൊത്തം കൊളസ്‌ട്രോൾ / LDL കൊളസ്‌ട്രോൾ / HDL കൊളസ്‌ട്രോൾ / ട്രൈഗ്ലിസറൈഡുകൾ / ഭാരം |
| records.selfEntered / fromReport / selfReported / bloodType / notProvided | Self-entered / From your report / Self-reported / Blood type / Not provided | مُدخل يدويًا / من تقريرك / مُدخل ذاتيًا / فصيلة الدم / غير متوفر | स्वयं दर्ज किया / आपकी रिपोर्ट से / स्वयं बताया गया / रक्त समूह / दिया नहीं गया | സ്വയം നൽകിയതു / നിങ്ങളുടെ റിപ്പോർട്ടിൽ നിന്ന് / സ്വയം റിപ്പോർട്ട് ചെയ്തത് / രക്തഗ്രൂപ്പ് / നൽകിയിട്ടില്ല |
| records.selfNotChecked / noRangePrinted | Entered by you. Not checked. / No range printed | أدخلت هذه القراءة بنفسك. لم يتم التحقق منها. / لا يوجد نطاق مطبوع | आपने दर्ज किया। इसकी जाँच नहीं हुई है। / कोई सीमा मुद्रित नहीं है | നിങ്ങൾ നൽകിയതാണ്. പരിശോധിച്ചിട്ടില്ല. / പരിധി അച്ചടിച്ചിട്ടില്ല |
| records.loadFailed / saveFailed / deleteFailed | Unable to load health records. Please try again. / Unable to save this reading. Please try again. / Unable to delete this reading. Please try again. | تعذر تحميل السجلات الصحية. يرجى المحاولة مرة أخرى. / تعذر حفظ هذه القراءة. يرجى المحاولة مرة أخرى. / تعذر حذف هذه القراءة. يرجى المحاولة مرة أخرى. | स्वास्थ्य रिकॉर्ड लोड नहीं हो सके। कृपया फिर प्रयास करें। / यह रीडिंग सहेजी नहीं जा सकी। कृपया फिर प्रयास करें। / यह रीडिंग हटाई नहीं जा सकी। कृपया फिर प्रयास करें। | ആരോഗ്യ രേഖകൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. / ഈ റീഡിംഗ് സംരക്ഷിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. / ഈ റീഡിംഗ് ഇല്ലാതാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| records.deleteConfirm / deleteReading / backToRecords / print | Delete this self-entered reading? / Delete reading / Back to health records / Print health record | هل تريد حذف هذه القراءة المُدخلة يدويًا؟ / حذف القراءة / العودة إلى السجلات الصحية / طباعة السجل الصحي | यह स्वयं दर्ज की गई रीडिंग हटाएँ? / रीडिंग हटाएँ / स्वास्थ्य रिकॉर्ड पर वापस जाएँ / स्वास्थ्य रिकॉर्ड प्रिंट करें | സ്വയം നൽകിയ ഈ റീഡിംഗ് ഇല്ലാതാക്കണോ? / റീഡിംഗ് ഇല്ലാതാക്കുക / ആരോഗ്യ രേഖകളിലേക്ക് മടങ്ങുക / ആരോഗ്യ രേഖ അച്ചടിക്കുക |
| records.noReadings / historyChart / readings / source / actions | No readings have been saved yet. / Readings over time / Readings / Source / Actions | لم يتم حفظ أي قراءات بعد. / القراءات بمرور الوقت / القراءات / المصدر / الإجراءات | अभी कोई रीडिंग सहेजी नहीं गई है। / समय के साथ रीडिंग / रीडिंग / स्रोत / कार्रवाई | ഇതുവരെ റീഡിംഗുകളൊന്നും സംരക്ഷിച്ചിട്ടില്ല. / കാലക്രമത്തിലുള്ള റീഡിംഗുകൾ / റീഡിംഗുകൾ / ഉറവിടം / നടപടികൾ |
| records.rangeNote | Ranges can differ between labs. Each point is compared with the range on its own report. | قد تختلف النطاقات بين المختبرات. تتم مقارنة كل نقطة بالنطاق الموجود في تقريرها. | अलग-अलग लैब की सीमाएँ अलग हो सकती हैं। हर बिंदु की तुलना उसकी अपनी रिपोर्ट की सीमा से होती है। | ലാബുകൾക്കിടയിൽ പരിധികൾ വ്യത്യാസപ്പെടാം. ഓരോ പോയിന്റും അതിന്റെ സ്വന്തം റിപ്പോർട്ടിലെ പരിധിയുമായി താരതമ്യം ചെയ്യുന്നു. |
| records.higherThanPrevious / lowerThanPrevious / discussChanges | Higher than the previous reading / Lower than the previous reading / Discuss changes with your doctor. | أعلى من القراءة السابقة / أقل من القراءة السابقة / ناقش التغييرات مع طبيبك. | पिछली रीडिंग से अधिक / पिछली रीडिंग से कम / बदलावों पर अपने डॉक्टर से चर्चा करें। | മുൻ റീഡിംഗിനെക്കാൾ ഉയർന്നത് / മുൻ റീഡിംഗിനെക്കാൾ താഴ്ന്നത് / മാറ്റങ്ങളെക്കുറിച്ച് ഡോക്ടറുമായി ചർച്ച ചെയ്യുക. |

Healthcare Navigator wording needs clinician and native speaker review:

Healthy-food directory layer labels, filters, provider-listing attribution, delivery-coverage wording, and caution text need native speaker review:

| Area | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| Healthy-food layer, filters, provider-listed plan/dietary tags, delivery coverage, directory disclaimer and states | See `map.food*` in `en.json` | See `map.food*` in `ar.json` | See `map.food*` in `hi.json` | See `map.food*` in `ml.json` |

| Key | English | Arabic | Hindi | Malayalam |
|---|---|---|---|---|
| chat.navigator.recommendation | This kind of concern is usually seen by a {specialty}. | عادةً ما يتابع هذا النوع من المخاوف {specialty}. | इस तरह की चिंता के लिए आमतौर पर {specialty} से मिलते हैं। | ഇത്തരത്തിലുള്ള ആശങ്കകൾ സാധാരണയായി {specialty} ആണ് പരിശോധിക്കുന്നത്. |
| chat.navigator.diagnosisDisclaimer | A doctor makes the diagnosis. Hayat AI cannot tell you what is wrong. | الطبيب هو من يشخّص الحالة. لا تستطيع Hayat AI إخبارك بما لديك. | निदान डॉक्टर करते हैं। Hayat AI यह नहीं बता सकता कि आपको क्या समस्या है। | രോഗനിർണയം നടത്തുന്നത് ഡോക്ടറാണ്. എന്താണ് പ്രശ്നമെന്ന് Hayat AI-ക്ക് പറയാനാവില്ല. |
| chat.navigator.emergencyNotice | If your symptoms are severe or getting worse, call 998 or go to an emergency department. | إذا كانت أعراضك شديدة أو تزداد سوءًا، فاتصل بـ 998 أو اذهب إلى قسم الطوارئ. | यदि आपके लक्षण गंभीर हैं या बिगड़ रहे हैं, तो 998 पर कॉल करें या आपातकालीन विभाग जाएँ। | ലക്ഷണങ്ങൾ ഗുരുതരമാണെങ്കിൽ അല്ലെങ്കിൽ വഷളാകുകയാണെങ്കിൽ, 998-ൽ വിളിക്കുകയോ അത്യാഹിത വിഭാഗത്തിലേക്ക് പോകുകയോ ചെയ്യുക. |
| chat.navigator.findPlaces / questions | Find places near me / Questions to bring to the doctor | العثور على أماكن بالقرب مني / أسئلة لطرحها على الطبيب | मेरे पास जगहें खोजें / डॉक्टर से पूछने के लिए सवाल | എന്റെ സമീപമുള്ള സ്ഥലങ്ങൾ കണ്ടെത്തുക / ഡോക്ടറോട് ചോദിക്കാനുള്ള ചോദ്യങ്ങൾ |
| chat.navigator.placeMatchNotice | Matched by name only. Call to confirm they have a {specialty} and ask about booking. | تمت المطابقة بالاسم فقط. اتصل للتأكد من توفر {specialty} واسأل عن حجز موعد. | मिलान केवल नाम के आधार पर है। कॉल करके पुष्टि करें कि वहाँ {specialty} उपलब्ध हैं और अपॉइंटमेंट के बारे में पूछें। | പേരിന്റെ അടിസ്ഥാനത്തിൽ മാത്രം പൊരുത്തപ്പെടുത്തി. {specialty} ഉണ്ടെന്ന് വിളിച്ച് സ്ഥിരീകരിക്കുകയും ബുക്കിംഗിനെക്കുറിച്ച് ചോദിക്കുകയും ചെയ്യുക. |
| chat.navigator.specialties.general_practice | general practitioner — Provides first-contact care for a range of health needs. | طبيب طب عام — يقدم رعاية أولية لمجموعة متنوعة من الاحتياجات الصحية. | सामान्य चिकित्सक — विभिन्न स्वास्थ्य जरूरतों के लिए शुरुआती देखभाल देते हैं। | ജനറൽ പ്രാക്ടീഷണർ — വിവിധ ആരോഗ്യ ആവശ്യങ്ങൾക്ക് ആദ്യഘട്ട പരിചരണം നൽകുന്നു. |
| chat.navigator.specialties.dermatology | dermatologist — Looks after skin, hair, and nail health. | طبيب جلدية — يتابع صحة الجلد والشعر والأظافر. | त्वचा रोग विशेषज्ञ — त्वचा, बाल और नाखूनों की देखभाल करते हैं। | ചർമ്മരോഗ വിദഗ്ധൻ — ചർമ്മം, മുടി, നഖങ്ങൾ എന്നിവയുടെ ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.ent | doctor specializing in ear, nose, and throat care — Looks after ear, nose, and throat health. | طبيب متخصص في الأنف والأذن والحنجرة — يتابع صحة الأذن والأنف والحنجرة. | कान, नाक और गले के विशेषज्ञ — कान, नाक और गले के स्वास्थ्य की देखभाल करते हैं। | ചെവി, മൂക്ക്, തൊണ്ട വിദഗ്ധൻ — ചെവി, മൂക്ക്, തൊണ്ട എന്നിവയുടെ ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.ophthalmology | vision-care doctor — Looks after eye health and vision. | طبيب عيون — يتابع صحة العين والبصر. | नेत्र चिकित्सक — आँखों के स्वास्थ्य और दृष्टि की देखभाल करते हैं। | കണ്ണ് വിദഗ്ധൻ — കണ്ണിന്റെ ആരോഗ്യവും കാഴ്ചയും നോക്കുന്നു. |
| chat.navigator.specialties.cardiology | cardiologist — Looks after heart and blood vessel health. | طبيب قلب — يتابع صحة القلب والأوعية الدموية. | हृदय रोग विशेषज्ञ — हृदय और रक्त वाहिकाओं के स्वास्थ्य की देखभाल करते हैं। | ഹൃദ്രോഗ വിദഗ്ധൻ — ഹൃദയത്തിന്റെയും രക്തക്കുഴലുകളുടെയും ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.orthopedics | orthopedic doctor — Looks after bones, joints, and muscles. | طبيب عظام — يتابع صحة العظام والمفاصل والعضلات. | हड्डी और जोड़ विशेषज्ञ — हड्डियों, जोड़ों और मांसपेशियों की देखभाल करते हैं। | അസ്ഥി-സന്ധി വിദഗ്ധൻ — അസ്ഥികൾ, സന്ധികൾ, പേശികൾ എന്നിവയുടെ ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.pediatrics | pediatrician — Provides health care for children. | طبيب أطفال — يقدم الرعاية الصحية للأطفال. | बाल रोग विशेषज्ञ — बच्चों को स्वास्थ्य देखभाल देते हैं। | ശിശുരോഗ വിദഗ്ധൻ — കുട്ടികൾക്ക് ആരോഗ്യപരിചരണം നൽകുന്നു. |
| chat.navigator.specialties.obstetrics_gynecology | doctor specializing in pregnancy and reproductive health — Looks after pregnancy and reproductive health. | طبيب نساء وولادة — يتابع الحمل والصحة الإنجابية. | प्रसूति और स्त्री रोग विशेषज्ञ — गर्भावस्था और प्रजनन स्वास्थ्य की देखभाल करते हैं। | പ്രസവ-സ്ത്രീരോഗ വിദഗ്ധൻ — ഗർഭാവസ്ഥയും പ്രത്യുത്പാദന ആരോഗ്യവും നോക്കുന്നു. |
| chat.navigator.specialties.dentistry | dentist — Looks after teeth and oral health. | طبيب أسنان — يتابع صحة الأسنان والفم. | दंत चिकित्सक — दाँतों और मुँह के स्वास्थ्य की देखभाल करते हैं। | ദന്തഡോക്ടർ — പല്ലുകളുടെയും വായയുടെയും ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.neurology | neurologist — Looks after the brain, spinal cord, and nerves. | طبيب أعصاب — يتابع الدماغ والحبل الشوكي والأعصاب. | तंत्रिका तंत्र विशेषज्ञ — मस्तिष्क, रीढ़ की हड्डी और नसों की देखभाल करते हैं। | നാഡീവ്യവസ്ഥാ വിദഗ്ധൻ — മസ്തിഷ്കം, സുഷുമ്നാനാഡി, നാഡികൾ എന്നിവയുടെ ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.gastroenterology | gastroenterologist — Looks after the digestive system. | طبيب جهاز هضمي — يتابع الجهاز الهضمي. | पाचन तंत्र विशेषज्ञ — पाचन तंत्र की देखभाल करते हैं। | ദഹനവ്യവസ്ഥാ വിദഗ്ധൻ — ദഹനവ്യവസ്ഥയുടെ ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.mental_health | mental health professional — Supports mental and emotional well-being. | اختصاصي صحة نفسية — يدعم الصحة النفسية والعاطفية. | मानसिक स्वास्थ्य विशेषज्ञ — मानसिक और भावनात्मक स्वास्थ्य में सहयोग देते हैं। | മാനസികാരോഗ്യ വിദഗ്ധൻ — മാനസികവും വൈകാരികവുമായ ക്ഷേമത്തിന് പിന്തുണ നൽകുന്നു. |
| chat.navigator.specialties.urology | urologist — Looks after urinary tract and reproductive health. | طبيب مسالك بولية — يتابع صحة الجهاز البولي والتناسلي. | मूत्र रोग विशेषज्ञ — मूत्र मार्ग और प्रजनन स्वास्थ्य की देखभाल करते हैं। | മൂത്ര-പ്രത്യുത്പാദന ആരോഗ്യ വിദഗ്ധൻ — മൂത്രപഥത്തിന്റെയും പ്രത്യുത്പാദന ആരോഗ്യത്തിന്റെയും കാര്യങ്ങൾ നോക്കുന്നു. |
| chat.navigator.specialties.endocrinology | hormone-health doctor — Looks after hormone-related health and glands. | طبيب غدد صماء — يتابع الصحة المرتبطة بالهرمونات والغدد. | हार्मोन और ग्रंथियों के विशेषज्ञ — हार्मोन और ग्रंथियों से जुड़े स्वास्थ्य की देखभाल करते हैं। | ഹോർമോൺ-ഗ്രന്ഥി വിദഗ്ധൻ — ഹോർമോണുകളും ഗ്രന്ഥികളും സംബന്ധിച്ച ആരോഗ്യം നോക്കുന്നു. |
| chat.navigator.specialties.pulmonology | lung-health doctor — Looks after lung health. | طبيب أمراض الرئة — يتابع صحة الرئتين. | फेफड़ों के विशेषज्ञ — फेफड़ों के स्वास्थ्य की देखभाल करते हैं। | ശ്വാസകോശ വിദഗ്ധൻ — ശ്വാസകോശത്തിന്റെ ആരോഗ്യം നോക്കുന്നു. |

The following Arabic, Hindi, and Malayalam wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Read aloud | اقرأ بصوت عالٍ | ज़ोर से पढ़ें | ഉച്ചത്തിൽ വായിക്കുക |
| Stop | إيقاف | रोकें | നിർത്തുക |
| Large text | نص كبير | बड़ा टेक्स्ट | വലിയ ടെക്സ്റ്റ് |
| No voice for this language on this device. | لا يوجد صوت لهذه اللغة على هذا الجهاز. | इस डिवाइस पर इस भाषा के लिए कोई आवाज़ उपलब्ध नहीं है। | ഈ ഉപകരണത്തിൽ ഈ ഭാഷയ്ക്ക് ശബ്ദം ലഭ്യമല്ല. |

Stage 7 wording also needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Upload | تحميل | अपलोड | അപ്‌ലോഡ് |
| History | السجل | इतिहास | ചരിത്രം |
| Loading reports... | جارٍ تحميل التقارير... | रिपोर्ट लोड हो रही हैं... | റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യുന്നു... |
| Unable to load reports. Please try again. | تعذر تحميل التقارير. يرجى المحاولة مرة أخرى. | रिपोर्ट लोड नहीं हो सकीं। कृपया फिर से प्रयास करें। | റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| No reports yet. | لا توجد تقارير بعد. | अभी कोई रिपोर्ट नहीं है। | റിപ്പോർട്ടുകളൊന്നുമില്ല. |
| Back to history | العودة إلى السجل | इतिहास पर वापस जाएँ | ചരിത്രത്തിലേക്ക് മടങ്ങുക |
| Download PDF | تنزيل PDF | PDF डाउनलोड करें | PDF ഡൗൺലോഡ് ചെയ്യുക |
| Hayat AI explanation | شرح حياة AI | Hayat AI व्याख्या | Hayat AI വിശദീകരണം |
| Date | التاريخ | तारीख | തീയതി |
| Lab report | تقرير مختبر | लैब रिपोर्ट | ലാബ് റിപ്പോർട്ട് |
| Prescription | وصفة طبية | प्रिस्क्रिप्शन | കുറിപ്പടി |
| Discharge summary | ملخص الخروج | डिस्चार्ज सारांश | ഡിസ്ചാർജ് സംഗ്രഹം |
| Imaging report | تقرير تصوير | इमेजिंग रिपोर्ट | ഇമേജിംഗ് റിപ്പോർട്ട് |
| Bill | فاتورة | बिल | ബിൽ |
| Referral letter | خطاب إحالة | रेफ़रल पत्र | റഫറൽ കത്ത് |
| Other | أخرى | अन्य | മറ്റുള്ളവ |
| Pending | قيد الانتظار | लंबित | തീർപ്പുകൽപ്പിക്കാത്തത് |
| Confirmed | مؤكد | पुष्टि की गई | സ്ഥിരീകരിച്ചു |
| Recent reports | التقارير الأخيرة | हाल की रिपोर्ट | സമീപകാല റിപ്പോർട്ടുകൾ |
| Out-of-range flags | القيم خارج النطاق | सीमा से बाहर के मान | പരിധിക്ക് പുറത്തുള്ള മൂല്യങ്ങൾ |
| Today's medicines | أدوية اليوم | आज की दवाएँ | ഇന്നത്തെ മരുന്നുകൾ |
| Next appointment | الموعد القادم | अगली अपॉइंटमेंट | അടുത്ത കൂടിക്കാഴ്ച |
| Quick SOS | استغاثة سريعة | त्वरित SOS | ദ്രുത SOS |
| Illustrative demo data | بيانات توضيحية تجريبية | उदाहरण के लिए डेमो डेटा | ഉദാഹരണ ഡെമോ ഡാറ്റ |
| No saved reports yet. | لا توجد تقارير محفوظة بعد. | अभी कोई सहेजी गई रिपोर्ट नहीं है। | സംരക്ഷിച്ച റിപ്പോർട്ടുകളില്ല. |
| No out-of-range values in your latest confirmed reports. | لا توجد قيم خارج النطاق في أحدث تقاريرك المؤكدة. | आपकी नवीनतम पुष्टि की गई रिपोर्टों में सीमा से बाहर कोई मान नहीं है। | ഏറ്റവും പുതിയ സ്ഥിരീകരിച്ച റിപ്പോർട്ടുകളിൽ പരിധിക്ക് പുറത്തുള്ള മൂല്യങ്ങളില്ല. |
| Unable to load your dashboard. Please try again. | تعذر تحميل لوحة المعلومات. يرجى المحاولة مرة أخرى. | डैशबोर्ड लोड नहीं हो सका। कृपया फिर से प्रयास करें। | ഡാഷ്ബോർഡ് ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| Vitamin D | فيتامين د | विटामिन D | വിറ്റാമിൻ D |
| After breakfast | بعد الإفطار | नाश्ते के बाद | പ്രഭാതഭക്ഷണത്തിന് ശേഷം |
| Daily multivitamin | فيتامينات يومية متعددة | दैनिक मल्टीविटामिन | ദൈനംദിന മൾട്ടിവിറ്റാമിൻ |
| With dinner | مع العشاء | रात के खाने के साथ | അത്താഴത്തോടൊപ്പം |
| Routine health check | فحص صحي دوري | नियमित स्वास्थ्य जाँच | പതിവ് ആരോഗ്യ പരിശോധന |
| June 15 | 15 يونيو | 15 जून | ജൂൺ 15 |
| This document seems to contain more than one person. Only the first person's results are shown. | يبدو أن هذا المستند يحتوي على بيانات لأكثر من شخص. يتم عرض نتائج الشخص الأول فقط. | इस दस्तावेज़ में एक से अधिक लोगों की जानकारी लगती है। केवल पहले व्यक्ति के परिणाम दिखाए गए हैं। | ഈ രേഖയിൽ ഒന്നിലധികം ആളുകളുടെ വിവരങ്ങളുണ്ടെന്ന് തോന്നുന്നു. ആദ്യ വ്യക്തിയുടെ ഫലങ്ങൾ മാത്രമാണ് കാണിക്കുന്നത്. |

Stage 8 wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Full name | الاسم الكامل | पूरा नाम | പൂർണ്ണ പേര് |
| Date of birth | تاريخ الميلاد | जन्म तिथि | ജനനത്തീയതി |
| Blood type | فصيلة الدم | रक्त समूह | രക്തഗ്രൂപ്പ് |
| Select blood type | اختر فصيلة الدم | रक्त समूह चुनें | രക്തഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക |
| Self-reported, not verified | مُدخل ذاتيًا، غير متحقق منه | स्वयं बताया गया, सत्यापित नहीं | സ്വയം നൽകിയ വിവരം, സ്ഥിരീകരിച്ചിട്ടില്ല |
| Self-reported | مُدخل ذاتيًا | स्वयं बताया गया | സ്വയം നൽകിയ വിവരം |
| Allergies | الحساسية | एलर्जी | അലർജികൾ |
| Add allergy | إضافة حساسية | एलर्जी जोड़ें | അലർജി ചേർക്കുക |
| Remove allergy | إزالة الحساسية | एलर्जी हटाएँ | അലർജി നീക്കുക |
| Emergency contact name | اسم جهة اتصال الطوارئ | आपातकालीन संपर्क का नाम | അടിയന്തര ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ പേര് |
| Emergency contact phone | هاتف جهة اتصال الطوارئ | आपातकालीन संपर्क का फ़ोन | അടിയന്തര ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ ഫോൺ |
| Emergency contact | جهة اتصال الطوارئ | आपातकालीन संपर्क | അടിയന്തര ബന്ധപ്പെടേണ്ട വ്യക്തി |
| Save | حفظ | सहेजें | സംരക്ഷിക്കുക |
| Saving... | جارٍ الحفظ... | सहेजा जा रहा है... | സംരക്ഷിക്കുന്നു... |
| Saved | تم الحفظ | सहेजा गया | സംരക്ഷിച്ചു |
| Care Card | بطاقة الرعاية | देखभाल कार्ड | പരിചരണ കാർഡ് |
| Not provided | غير مُدخل | नहीं दिया गया | നൽകിയിട്ടില്ല |
| None listed | لا توجد معلومات | कोई जानकारी नहीं | വിവരങ്ങളൊന്നുമില്ല |
| Print Care Card | طباعة بطاقة الرعاية | देखभाल कार्ड प्रिंट करें | പരിചരണ കാർഡ് പ്രിന്റ് ചെയ്യുക |
| SOS | استغاثة | SOS | SOS |
| Emergency information | معلومات الطوارئ | आपातकालीन जानकारी | അടിയന്തര വിവരങ്ങൾ |
| Emergency number | رقم الطوارئ | आपातकालीन नंबर | അടിയന്തര നമ്പർ |
| Message on WhatsApp | إرسال رسالة عبر واتساب | WhatsApp पर संदेश भेजें | WhatsApp-ൽ സന്ദേശമയയ്ക്കുക |
| Send SMS | إرسال رسالة SMS | SMS भेजें | SMS അയയ്ക്കുക |
| Call | اتصال | कॉल करें | വിളിക്കുക |
| Add an emergency contact in your Passport first. | أضف جهة اتصال للطوارئ في الملف الصحي أولًا. | पहले अपने पासपोर्ट में आपातकालीन संपर्क जोड़ें। | ആദ്യം നിങ്ങളുടെ പാസ്‌പോർട്ടിൽ അടിയന്തര ബന്ധപ്പെടേണ്ട വ്യക്തിയെ ചേർക്കുക. |
| Check the phone number in your Passport. Include the country code. | تحقق من رقم الهاتف في الملف الصحي. أضف رمز الدولة. | अपने पासपोर्ट में फ़ोन नंबर जाँचें। देश का कोड शामिल करें। | പാസ്‌പോർട്ടിലെ ഫോൺ നമ്പർ പരിശോധിക്കുക. രാജ്യകോഡ് ഉൾപ്പെടുത്തുക. |
| Hayat AI opens your app. You must press send yourself. | يفتح Hayat AI تطبيقك. يجب أن تضغط على إرسال بنفسك. | Hayat AI आपका ऐप खोलता है। आपको स्वयं भेजें दबाना होगा। | Hayat AI നിങ്ങളുടെ ആപ്പ് തുറക്കും. അയയ്ക്കാൻ നിങ്ങൾ തന്നെ അമർത്തണം. |

Stage 11 chatbot wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| chat.loadFailed | تعذر تحميل المحادثة. | चैट लोड नहीं हो सकी। | ചാറ്റ് ലോഡ് ചെയ്യാനായില്ല. |
| chat.sendFailed | تعذر إرسال رسالتك. | आपका संदेश नहीं भेजा जा सका। | നിങ്ങളുടെ സന്ദേശം അയയ്ക്കാനായില്ല. |
| chat.clearFailed | تعذر مسح سجل المحادثة. | चैट इतिहास साफ़ नहीं हो सका। | ചാറ്റ് ചരിത്രം മായ്ക്കാനായില്ല. |
| chat.rateLimit | يرجى الانتظار قليلًا قبل إرسال رسالة أخرى. | दूसरा संदेश भेजने से पहले कृपया थोड़ी देर प्रतीक्षा करें। | മറ്റൊരു സന്ദേശം അയയ്ക്കുന്നതിന് മുമ്പ് അല്പം കാത്തിരിക്കുക. |
| chat.busyMessage | الذكاء الاصطناعي مشغول جدًا الآن. يرجى الانتظار دقيقة والمحاولة مرة أخرى. | AI अभी बहुत व्यस्त है। कृपया एक मिनट प्रतीक्षा करके फिर प्रयास करें। | AI ഇപ്പോൾ വളരെ തിരക്കിലാണ്. ഒരു മിനിറ്റ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക. |
| chat.clearChat / chat.clearConfirm | مسح المحادثة / هل تريد مسح سجل المحادثة؟ | चैट साफ़ करें / क्या आप चैट इतिहास साफ़ करना चाहते हैं? | ചാറ്റ് മായ്ക്കുക / ചാറ്റ് ചരിത്രം മായ്ക്കണോ? |
| chat.reportSelector / chat.allReports | التقارير المستخدمة / كل تقاريري | इस्तेमाल करने के लिए रिपोर्ट / मेरी सभी रिपोर्ट | ഉപയോഗിക്കേണ്ട റിപ്പോർട്ടുകൾ / എന്റെ എല്ലാ റിപ്പോർട്ടുകളും |
| chat.suggestedQuestions | أسئلة مقترحة | सुझाए गए प्रश्न | നിർദ്ദേശിച്ച ചോദ്യങ്ങൾ |
| chat.questions.outsideRangeQuestion | ما القيم التي تقع خارج النطاق في تقريري؟ | मेरी रिपोर्ट में कौन-से मान दी गई सीमा से बाहर हैं? | എന്റെ റിപ്പോർട്ടിലെ പരിധിക്ക് പുറത്തുള്ള മൂല്യങ്ങൾ ഏതൊക്കെയാണ്? |
| chat.questions.valueMeaningQuestion | ما معنى كل قيمة في تقريري؟ | मेरी रिपोर्ट का हर मान क्या बताता है? | എന്റെ റിപ്പോർട്ടിലെ ഓരോ മൂല്യത്തിന്റെയും അർത്ഥമെന്താണ്? |
| chat.questions.prescriptionMedicinesQuestion | ما الأدوية المذكورة في وصفتي؟ | मेरे प्रिस्क्रिप्शन में कौन-सी दवाएँ हैं? | എന്റെ കുറിപ്പടിയിൽ ഏതൊക്കെ മരുന്നുകളാണുള്ളത്? |
| chat.questions.nextStepsQuestion | ماذا يقول تقريري عن الخطوات التالية؟ | मेरी रिपोर्ट अगले कदमों के बारे में क्या कहती है? | അടുത്ത നടപടികളെക്കുറിച്ച് എന്റെ റിപ്പോർട്ട് എന്താണ് പറയുന്നത്? |
| chat.basedOn | استنادًا إلى: | आधारित: | അടിസ്ഥാനം: |
| chat.emergencyMessage | إذا كانت هذه حالة طارئة، فاتصل الآن بالإسعاف على {ambulance} أو بالشرطة على {police}. | यदि यह आपातकाल है, तो अभी एम्बुलेंस के लिए {ambulance} या पुलिस के लिए {police} पर कॉल करें। | ഇത് അടിയന്തരാവസ്ഥയാണെങ്കിൽ, ആംബുലൻസിന് {ambulance} അല്ലെങ്കിൽ പോലീസിന് {police} എന്ന നമ്പറിൽ ഇപ്പോൾ വിളിക്കുക. |
| chat.openSos | فتح الاستغاثة | SOS खोलें | SOS തുറക്കുക |
| chat.loading | جارٍ تحميل المحادثة... | चैट लोड हो रही है... | ചാറ്റ് ലോഡ് ചെയ്യുന്നു... |
| chat.typing | حياة تكتب... | हयात लिख रही है... | ഹയാത്ത് ടൈപ്പ് ചെയ്യുന്നു... |
| chat.messageLabel / chat.messagePlaceholder | رسالتك / راسل حياة... | आपका संदेश / हयात को संदेश भेजें... | നിങ്ങളുടെ സന്ദേശം / ഹയാത്തിന് സന്ദേശം അയയ്ക്കുക... |
| chat.send / chat.sending / chat.retry | إرسال / جارٍ الإرسال... / إعادة المحاولة | भेजें / भेजा जा रहा है... / फिर प्रयास करें | അയയ്ക്കുക / അയയ്ക്കുന്നു... / വീണ്ടും ശ്രമിക്കുക |
| chat.thinking | حياة تكتب... | हयात लिख रही है... | ഹയാത്ത് ടൈപ്പ് ചെയ്യുന്നു... |
| chat.disclaimer | قد تخطئ حياة. إنها تشرح المعلومات وليست نصيحة طبية. في الطوارئ اتصل بـ 998 أو 999. | हयात से गलती हो सकती है। यह जानकारी समझाती है, चिकित्सा सलाह नहीं देती। आपातकाल में 998 या 999 पर कॉल करें। | ഹയാത്തിന് പിഴവുകൾ സംഭവിക്കാം. ഇത് വിവരങ്ങൾ വിശദീകരിക്കുന്നതാണ്, മെഡിക്കൽ ഉപദേശമല്ല. അടിയന്തരാവസ്ഥയിൽ 998 അല്ലെങ്കിൽ 999 വിളിക്കുക. |
| Add my location to the message | إضافة موقعي إلى الرسالة | संदेश में मेरा स्थान जोड़ें | സന്ദേശത്തിൽ എന്റെ ലൊക്കേഷൻ ചേർക്കുക |
| Location added to the message. | تمت إضافة الموقع إلى الرسالة. | संदेश में स्थान जोड़ दिया गया। | സന്ദേശത്തിൽ ലൊക്കേഷൻ ചേർത്തു. |
| Location permission was denied or unavailable. | تم رفض إذن الموقع أو أنه غير متاح. | स्थान की अनुमति अस्वीकार की गई या उपलब्ध नहीं है। | ലൊക്കേഷൻ അനുമതി നിരസിച്ചു അല്ലെങ്കിൽ ലഭ്യമല്ല. |
| Location is not available on this device. | الموقع غير متاح على هذا الجهاز. | इस डिवाइस पर स्थान उपलब्ध नहीं है। | ഈ ഉപകരണത്തിൽ ലൊക്കേഷൻ ലഭ്യമല്ല. |
| Not set | غير محددة | सेट नहीं है | സജ്ജമാക്കിയിട്ടില്ല |
| None | لا توجد | कोई नहीं | ഒന്നുമില്ല |
| SOS from Hayat AI. I need help. Blood type (self-reported): {bloodType}. Allergies: {allergies}. | استغاثة من Hayat AI. أحتاج إلى المساعدة. فصيلة الدم (مُدخلة ذاتيًا): {bloodType}. الحساسية: {allergies}. | Hayat AI से SOS। मुझे मदद चाहिए। रक्त समूह (स्वयं बताया गया): {bloodType}। एलर्जी: {allergies}। | Hayat AI-യിൽ നിന്നുള്ള SOS. എനിക്ക് സഹായം വേണം. രക്തഗ്രൂപ്പ് (സ്വയം നൽകിയ വിവരം): {bloodType}. അലർജികൾ: {allergies}. |
| My location: {url} | موقعي: {url} | मेरा स्थान: {url} | എന്റെ ലൊക്കേഷൻ: {url} |
| Find nearest emergency department | العثور على أقرب قسم طوارئ | निकटतम आपातकालीन विभाग खोजें | അടുത്തുള്ള അത്യാഹിത വിഭാഗം കണ്ടെത്തുക |
| Hayat AI is not an emergency service. | حياة AI ليست خدمة طوارئ. | Hayat AI आपातकालीन सेवा नहीं है। | Hayat AI ഒരു അടിയന്തര സേവനമല്ല. |
| Ambulance | الإسعاف | एम्बुलेंस | ആംബുലൻസ് |
| Police | الشرطة | पुलिस | പോലീസ് |
| Fire | الإطفاء | अग्निशमन | അഗ്നിശമനം |
| Anyone who scans this QR sees these details. | يمكن لأي شخص يمسح رمز QR الاطلاع على هذه التفاصيل. | इस QR को स्कैन करने वाला कोई भी व्यक्ति ये विवरण देख सकता है। | ഈ QR സ്കാൻ ചെയ്യുന്ന ആർക്കും ഈ വിവരങ്ങൾ കാണാം. |

Stage 9 wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Pharmacies for my medicines | صيدليات لأدويتي | मेरी दवाओं के लिए फ़ार्मेसी | എന്റെ മരുന്നുകൾക്കുള്ള ഫാർമസികൾ |
| Open now | مفتوح الآن | अभी खुला है | ഇപ്പോൾ തുറന്നിരിക്കുന്നു |
| 24-hour | مفتوح 24 ساعة | 24 घंटे | 24 മണിക്കൂർ |
| Wheelchair accessible (filter) | يمكن الوصول إليه بالكراسي المتحركة | व्हीलचेयर के लिए सुलभ | വീൽചെയർ സൗകര്യമുള്ളത് |
| Facility type | نوع المرفق | सुविधा का प्रकार | സ്ഥാപനത്തിന്റെ തരം |
| All | الكل | सभी | എല്ലാം |
| Pharmacies | الصيدليات | फ़ार्मेसी | ഫാർമസികൾ |
| Hospitals and clinics | المستشفيات والعيادات | अस्पताल और क्लीनिक | ആശുപത്രികളും ക്ലിനിക്കുകളും |
| Use my location | استخدام موقعي | मेरी लोकेशन का उपयोग करें | എന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക |
| Getting location... | جارٍ تحديد الموقع... | लोकेशन प्राप्त हो रही है... | ലൊക്കേഷൻ കണ്ടെത്തുന്നു... |
| Pharmacy | صيدلية | फ़ार्मेसी | ഫാർമസി |
| Hospital | مستشفى | अस्पताल | ആശുപത്രി |
| Clinic | عيادة | क्लीनिक | ക്ലിനിക്ക് |
| Open | مفتوح | खुला है | തുറന്നിരിക്കുന്നു |
| Closed | مغلق | बंद है | അടച്ചിരിക്കുന്നു |
| Hours | ساعات العمل | समय | സമയം |
| 24 hours | 24 ساعة | 24 घंटे | 24 മണിക്കൂർ |
| Address | العنوان | पता | വിലാസം |
| Yes | نعم | हाँ | അതെ |
| No | لا | नहीं | ഇല്ല |
| Emergency department | قسم الطوارئ | आपातकालीन विभाग | അത്യാഹിത വിഭാഗം |
| Directions | الاتجاهات | रास्ता | ദിശകൾ |
| Call to confirm stock | اتصل للتأكد من توفر الدواء | स्टॉक की पुष्टि के लिए कॉल करें | ലഭ്യത സ്ഥിരീകരിക്കാൻ വിളിക്കുക |
| Phone to verify | يجب التحقق من رقم الهاتف | फ़ोन की पुष्टि करें | ഫോൺ സ്ഥിരീകരിക്കണം |
| Your location | موقعك | आपकी लोकेशन | നിങ്ങളുടെ ലൊക്കേഷൻ |
| No facilities match these filters. | لا توجد مرافق تطابق عوامل التصفية. | इन फ़िल्टर से मेल खाने वाली कोई सुविधा नहीं है। | ഈ ഫിൽട്ടറുകളുമായി പൊരുത്തപ്പെടുന്ന സ്ഥാപനങ്ങളില്ല. |
| Loading medicine names... | جارٍ تحميل أسماء الأدوية... | दवाओं के नाम लोड हो रहे हैं... | മരുന്നുകളുടെ പേരുകൾ ലോഡ് ചെയ്യുന്നു... |
| Unable to load this report. Please try again. | تعذر تحميل هذا التقرير. يرجى المحاولة مرة أخرى. | यह रिपोर्ट लोड नहीं हो सकी। कृपया फिर से प्रयास करें। | ഈ റിപ്പോർട്ട് ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| No medicine names were found in this report. | لم يتم العثور على أسماء أدوية في هذا التقرير. | इस रिपोर्ट में दवाओं के नाम नहीं मिले। | ഈ റിപ്പോർട്ടിൽ മരുന്നുകളുടെ പേരുകൾ കണ്ടെത്തിയില്ല. |
| Call the pharmacy to confirm they have your medicines in stock. Hayat AI does not show stock. | اتصل بالصيدلية للتأكد من توفر أدويتك. لا يعرض Hayat AI معلومات التوفر. | दवाओं की उपलब्धता की पुष्टि के लिए फ़ार्मेसी को कॉल करें। Hayat AI स्टॉक नहीं दिखाता। | മരുന്നുകൾ ലഭ്യമാണോ എന്ന് സ്ഥിരീകരിക്കാൻ ഫാർമസിയിൽ വിളിക്കുക. Hayat AI സ്റ്റോക്ക് കാണിക്കുന്നില്ല. |
| In an emergency, call the official emergency number. Hayat AI is not an emergency service. | في حالة الطوارئ، اتصل برقم الطوارئ الرسمي. Hayat AI ليست خدمة طوارئ. | आपातकाल में, आधिकारिक आपातकालीन नंबर पर कॉल करें। Hayat AI आपातकालीन सेवा नहीं है। | അടിയന്തരാവസ്ഥയിൽ, ഔദ്യോഗിക അടിയന്തര നമ്പറിൽ വിളിക്കുക. Hayat AI ഒരു അടിയന്തര സേവനമല്ല. |

Stage 10 wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Data from OpenStreetMap contributors, may be incomplete. Call to confirm before you go. | البيانات من مساهمي OpenStreetMap وقد تكون غير مكتملة. اتصل للتأكد قبل الذهاب. | OpenStreetMap योगदानकर्ताओं का डेटा, अधूरा हो सकता है। जाने से पहले कॉल करके पुष्टि करें। | OpenStreetMap സംഭാവകരിൽ നിന്നുള്ള ഡാറ്റ; അപൂർണ്ണമായിരിക്കാം. പോകുന്നതിന് മുമ്പ് വിളിച്ച് ഉറപ്പാക്കുക. |
| Saved OpenStreetMap data from {date}, may be incomplete. Call to confirm before you go. | بيانات OpenStreetMap محفوظة من {date}، وقد تكون غير مكتملة. اتصل للتأكد قبل الذهاب. | {date} का सहेजा गया OpenStreetMap डेटा, अधूरा हो सकता है। जाने से पहले कॉल करके पुष्टि करें। | {date}-ലെ സംരക്ഷിച്ച OpenStreetMap ഡാറ്റ; അപൂർണ്ണമായിരിക്കാം. പോകുന്നതിന് മുമ്പ് വിളിച്ച് ഉറപ്പാക്കുക. |
| Map data service busy. Showing SAMPLE data, not real facilities. | خدمة بيانات الخريطة مشغولة. يتم عرض بيانات نموذجية وليست مرافق حقيقية. | मैप डेटा सेवा व्यस्त है। नमूना डेटा दिखाया जा रहा है, वास्तविक सुविधाएँ नहीं। | മാപ്പ് ഡാറ്റ സേവനം തിരക്കിലാണ്. സാമ്പിൾ ഡാറ്റയാണ് കാണിക്കുന്നത്, യഥാർത്ഥ സ്ഥാപനങ്ങളല്ല. |
| Healthcare | الرعاية الصحية | स्वास्थ्य सेवा | ആരോഗ്യപരിചരണം |
| Wellness | العافية | कल्याण | ക്ഷേമം |
| Directory file, not verified. Call to confirm. | ملف دليل غير مُتحقق منه. اتصل للتأكد. | निर्देशिका फ़ाइल सत्यापित नहीं है। पुष्टि के लिए कॉल करें। | ഡയറക്ടറി ഫയൽ സ്ഥിരീകരിച്ചിട്ടില്ല. ഉറപ്പാക്കാൻ വിളിക്കുക. |
| Healthcare directory | دليل الرعاية الصحية | स्वास्थ्य सेवा निर्देशिका | ആരോഗ്യപരിചരണ ഡയറക്ടറി |
| Emirate | الإمارة | अमीरात | എമിറേറ്റ് |
| Loading directory entries... | جارٍ تحميل عناصر الدليل... | निर्देशिका की प्रविष्टियाँ लोड हो रही हैं... | ഡയറക്ടറി വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു... |
| The directory could not be loaded. Please try again. | تعذر تحميل الدليل. يرجى المحاولة مرة أخرى. | निर्देशिका लोड नहीं हो सकी। कृपया फिर प्रयास करें। | ഡയറക്ടറി ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| No verified wellness directory is available. Information not verified. | لا يتوفر دليل عافية مُتحقق منه. المعلومات غير مُتحقق منها. | कल्याण सेवाओं की कोई सत्यापित निर्देशिका उपलब्ध नहीं है। जानकारी सत्यापित नहीं है। | സ്ഥിരീകരിച്ച ക്ഷേമ ഡയറക്ടറി ലഭ്യമല്ല. വിവരങ്ങൾ സ്ഥിരീകരിച്ചിട്ടില്ല. |
| No directory entries match these filters. | لا توجد عناصر في الدليل تطابق عوامل التصفية. | इन फ़िल्टर से मेल खाने वाली निर्देशिका प्रविष्टियाँ नहीं हैं। | ഈ ഫിൽട്ടറുകൾക്ക് അനുയോജ്യമായ ഡയറക്ടറി വിവരങ്ങളില്ല. |
| Information not verified | المعلومات غير مُتحقق منها | जानकारी सत्यापित नहीं है | വിവരം സ്ഥിരീകരിച്ചിട്ടില്ല |
| Category | الفئة | श्रेणी | വിഭാഗം |
| Address confidence | موثوقية العنوان | पते की विश्वसनीयता | വിലാസത്തിന്റെ വിശ്വാസ്യത |
| High / Medium / Low / Unknown | عالية / متوسطة / منخفضة / غير معروفة | उच्च / मध्यम / कम / अज्ञात | ഉയർന്നത് / ഇടത്തരം / കുറഞ്ഞത് / അജ്ഞാതം |
| Address not fully verified | العنوان غير مُتحقق منه بالكامل | पता पूरी तरह सत्यापित नहीं है | വിലാസം പൂർണ്ണമായി സ്ഥിരീകരിച്ചിട്ടില്ല |
| Approximate location | موقع تقريبي | अनुमानित स्थान | ഏകദേശ സ്ഥലം |
| Previous / Next | السابق / التالي | पिछला / अगला | മുമ്പത്തെ / അടുത്തത് |
| Page {page} of {pages} | الصفحة {page} من {pages} | पृष्ठ {page} / {pages} | പേജ് {page} / {pages} |
| Search this area | البحث في هذه المنطقة | इस क्षेत्र में खोजें | ഈ പ്രദേശത്ത് തിരയുക |
| Loading facilities... | جارٍ تحميل المرافق... | सुविधाएँ लोड हो रही हैं... | സ്ഥാപനങ്ങൾ ലോഡ് ചെയ്യുന്നു... |
| Location not available. Showing facilities near Dubai city centre. | الموقع غير متاح. يتم عرض المرافق القريبة من وسط مدينة دبي. | लोकेशन उपलब्ध नहीं है। दुबई शहर के केंद्र के पास की सुविधाएँ दिखाई जा रही हैं। | ലൊക്കേഷൻ ലഭ്യമല്ല. ദുബായ് നഗരമധ്യത്തിന് സമീപമുള്ള സ്ഥാപനങ്ങൾ കാണിക്കുന്നു. |
| Hours unknown | ساعات العمل غير معروفة | समय की जानकारी नहीं है | സമയം ലഭ്യമല്ല |
| Accessibility | إمكانية الوصول | सुलभता | പ്രവേശന സൗകര്യം |
| Not wheelchair accessible | غير مهيأ للكراسي المتحركة | व्हीलचेयर के लिए सुलभ नहीं | വീൽചെയർ സൗകര്യമില്ല |
| Limited wheelchair access | إمكانية محدودة للكراسي المتحركة | व्हीलचेयर की सीमित सुविधा | പരിമിതമായ വീൽചെയർ സൗകര്യം |
| Accessibility not listed | إمكانية الوصول غير مدرجة | सुलभता की जानकारी नहीं दी गई | പ്രവേശന സൗകര്യത്തെക്കുറിച്ചുള്ള വിവരമില്ല |
| Phone not listed | رقم الهاتف غير مدرج | फ़ोन नंबर सूचीबद्ध नहीं है | ഫോൺ നമ്പർ നൽകിയിട്ടില്ല |
| No emergency departments are listed in this area. Call the official emergency number. | لا توجد أقسام طوارئ مدرجة في هذه المنطقة. اتصل برقم الطوارئ الرسمي. | इस क्षेत्र में कोई आपातकालीन विभाग सूचीबद्ध नहीं है। आधिकारिक आपातकालीन नंबर पर कॉल करें। | ഈ പ്രദേശത്ത് അത്യാഹിത വിഭാഗങ്ങളൊന്നും പട്ടികപ്പെടുത്തിയിട്ടില്ല. ഔദ്യോഗിക അടിയന്തര നമ്പറിൽ വിളിക്കുക. |
| Licensed facility, MOHAP open data 2026 | منشأة مرخصة، بيانات MOHAP المفتوحة 2026 | लाइसेंस प्राप्त सुविधा, MOHAP ओपन डेटा 2026 | ലൈസൻസുള്ള സ്ഥാപനം, MOHAP ഓപ്പൺ ഡാറ്റ 2026 |
| OpenStreetMap, may be incomplete | OpenStreetMap، قد تكون البيانات غير مكتملة | OpenStreetMap, डेटा अधूरा हो सकता है | OpenStreetMap, ഡാറ്റ അപൂർണ്ണമായിരിക്കാം |
| Closed now | مغلق الآن | अभी बंद है | ഇപ്പോൾ അടച്ചിരിക്കുന്നു |
| Hours not listed. Call to confirm. | ساعات العمل غير مدرجة. اتصل للتأكد. | समय सूचीबद्ध नहीं है। पुष्टि के लिए कॉल करें। | സമയം നൽകിയിട്ടില്ല. സ്ഥിരീകരിക്കാൻ വിളിക്കുക. |

Stage 10 care wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Care | الرعاية | देखभाल | പരിചരണം |
| Add to calendar | أضف إلى التقويم | कैलेंडर में जोड़ें | കലണ്ടറിലേക്ക് ചേർക്കുക |
| Today | اليوم | आज | ഇന്ന് |
| Reminders | التذكيرات | रिमाइंडर | ഓർമ്മപ്പെടുത്തലുകൾ |
| Calendar | التقويم | कैलेंडर | കലണ്ടർ |
| Insurance (demo) | التأمين (تجريبي) | बीमा (डेमो) | ഇൻഷുറൻസ് (ഡെമോ) |
| Today's checklist | قائمة اليوم | आज की जाँच सूची | ഇന്നത്തെ ചെക്ക്ലിസ്റ്റ് |
| Follow your doctor's instructions. Hayat AI does not set or change doses. | اتبع تعليمات طبيبك. لا تحدد Hayat AI الجرعات ولا تغيرها. | अपने डॉक्टर के निर्देशों का पालन करें। Hayat AI खुराक तय या बदलता नहीं है। | ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾ പാലിക്കുക. Hayat AI ഡോസ് നിശ്ചയിക്കുകയോ മാറ്റുകയോ ചെയ്യുന്നില്ല. |
| Printed on your prescription: {dose} | الجرعة المطبوعة في وصفتك: {dose} | आपके प्रिस्क्रिप्शन पर छपी खुराक: {dose} | നിങ്ങളുടെ കുറിപ്പടിയിൽ അച്ചടിച്ച ഡോസ്: {dose} |
| Reminders work while Hayat AI is open. Phone push reminders come later. | تعمل التذكيرات أثناء فتح Hayat AI. ستتوفر إشعارات الهاتف لاحقًا. | Hayat AI खुला रहने पर रिमाइंडर काम करते हैं। फ़ोन पुश रिमाइंडर बाद में आएँगे। | Hayat AI തുറന്നിരിക്കുമ്പോൾ ഓർമ്മപ്പെടുത്തലുകൾ പ്രവർത്തിക്കും. ഫോൺ പുഷ് ഓർമ്മപ്പെടുത്തലുകൾ പിന്നീട് ലഭ്യമാകും. |
| Enable notifications | تفعيل الإشعارات | सूचनाएँ चालू करें | അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കുക |
| Unable to load care information. Please try again. | تعذر تحميل معلومات الرعاية. يرجى المحاولة مرة أخرى. | देखभाल की जानकारी लोड नहीं हो सकी। कृपया फिर से प्रयास करें। | പരിചരണ വിവരങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| Unable to save this change. Please try again. | تعذر حفظ هذا التغيير. يرجى المحاولة مرة أخرى. | यह बदलाव सहेजा नहीं जा सका। कृपया फिर से प्रयास करें। | ഈ മാറ്റം സംരക്ഷിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| Browser notifications are not available. | إشعارات المتصفح غير متاحة. | ब्राउज़र सूचनाएँ उपलब्ध नहीं हैं। | ബ്രൗസർ അറിയിപ്പുകൾ ലഭ്യമല്ല. |
| Browser notifications enabled. | تم تفعيل إشعارات المتصفح. | ब्राउज़र सूचनाएँ चालू हैं। | ബ്രൗസർ അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കി. |
| Notifications were not allowed. | لم يتم السماح بالإشعارات. | सूचनाओं की अनुमति नहीं मिली। | അറിയിപ്പുകൾ അനുവദിച്ചില്ല. |
| Medicine | الدواء | दवा | മരുന്ന് |
| Choose a prescription medicine | اختر دواءً من الوصفة | अपने प्रिस्क्रिप्शन से दवा चुनें | കുറിപ്പടിയിൽ നിന്ന് മരുന്ന് തിരഞ്ഞെടുക്കുക |
| Type a medicine name | اكتب اسم دواء | दवा का नाम लिखें | മരുന്നിന്റെ പേര് ടൈപ്പ് ചെയ്യുക |
| Medicine name | اسم الدواء | दवा का नाम | മരുന്നിന്റെ പേര് |
| Time | الوقت | समय | സമയം |
| Weekdays | أيام الأسبوع | सप्ताह के दिन | ആഴ്ചയിലെ ദിവസങ്ങൾ |
| Add reminder | أضف تذكيرًا | रिमाइंडर जोड़ें | ഓർമ്മപ്പെടുത്തൽ ചേർക്കുക |
| Saved reminders | التذكيرات المحفوظة | सहेजे गए रिमाइंडर | സംരക്ഷിച്ച ഓർമ്മപ്പെടുത്തലുകൾ |
| No reminders yet. | لا توجد تذكيرات بعد. | अभी कोई रिमाइंडर नहीं है। | ഓർമ്മപ്പെടുത്തലുകളൊന്നുമില്ല. |
| Delete | حذف | हटाएँ | ഇല്ലാതാക്കുക |
| Previous month | الشهر السابق | पिछला महीना | മുൻ മാസം |
| Next month | الشهر التالي | अगला महीना | അടുത്ത മാസം |
| Time to take {medicine} | حان وقت تناول {medicine} | {medicine} लेने का समय | {medicine} കഴിക്കേണ്ട സമയമായി |
| Taken | تم التناول | ले ली | കഴിച്ചു |
| No upcoming appointments. | لا توجد مواعيد قادمة. | कोई आगामी अपॉइंटमेंट नहीं है। | വരാനിരിക്കുന്ന അപ്പോയിന്റ്മെന്റുകളില്ല. |
| Appointment | موعد | अपॉइंटमेंट | അപ്പോയിന്റ്മെന്റ് |
| Add appointment | أضف موعدًا | अपॉइंटमेंट जोड़ें | അപ്പോയിന്റ്മെന്റ് ചേർക്കുക |
| Confirm the date before saving this appointment. | يرجى تأكيد التاريخ قبل حفظ هذا الموعد. | अपॉइंटमेंट सहेजने से पहले तारीख की पुष्टि करें। | അപ്പോയിന്റ്മെന്റ് സംരക്ഷിക്കുന്നതിന് മുമ്പ് തീയതി സ്ഥിരീകരിക്കുക. |
| Title | العنوان | शीर्षक | തലക്കെട്ട് |
| Date | التاريخ | तारीख | തീയതി |
| Place | المكان | स्थान | സ്ഥലം |
| Notes | ملاحظات | नोट्स | കുറിപ്പുകൾ |
| Save appointment | احفظ الموعد | अपॉइंटमेंट सहेजें | അപ്പോയിന്റ്മെന്റ് സംരക്ഷിക്കുക |
| Cancel | إلغاء | रद्द करें | റദ്ദാക്കുക |
| Appointments this month | مواعيد هذا الشهر | इस महीने के अपॉइंटमेंट | ഈ മാസത്തെ അപ്പോയിന്റ്മെന്റുകൾ |
| No appointments this month. | لا توجد مواعيد هذا الشهر. | इस महीने कोई अपॉइंटमेंट नहीं है। | ഈ മാസത്തിൽ അപ്പോയിന്റ്മെന്റുകളില്ല. |
| Open calendar | افتح التقويم | कैलेंडर खोलें | കലണ്ടർ തുറക്കുക |
| Insurance | التأمين | बीमा | ഇൻഷുറൻസ് |
| No insurance policy saved. | لا توجد وثيقة تأمين محفوظة. | कोई बीमा पॉलिसी सहेजी नहीं गई है। | ഇൻഷുറൻസ് പോളിസി സംരക്ഷിച്ചിട്ടില്ല. |
| Manage insurance | إدارة التأمين | बीमा प्रबंधित करें | ഇൻഷുറൻസ് കൈകാര്യം ചെയ്യുക |
| Estimate only, using the numbers you entered. Check with your insurer. | تقدير فقط باستخدام الأرقام التي أدخلتها. تحقق من شركة التأمين. | केवल अनुमान, आपके द्वारा दर्ज किए गए आँकड़ों के आधार पर। अपने बीमाकर्ता से जाँचें। | നിങ്ങൾ നൽകിയ സംഖ്യകൾ ഉപയോഗിച്ചുള്ള ഏകദേശ കണക്കു മാത്രം. ഇൻഷുററുമായി പരിശോധിക്കുക. |
| Bill estimate | تقدير الفاتورة | बिल अनुमान | ബിൽ കണക്ക് |
| No confirmed bill report is available. | لا يوجد تقرير فاتورة مؤكد. | कोई पुष्ट बिल रिपोर्ट उपलब्ध नहीं है। | സ്ഥിരീകരിച്ച ബിൽ റിപ്പോർട്ട് ലഭ്യമല്ല. |
| Choose a confirmed bill report | اختر تقرير فاتورة مؤكدًا | पुष्ट बिल रिपोर्ट चुनें | സ്ഥിരീകരിച്ച ബിൽ റിപ്പോർട്ട് തിരഞ്ഞെടുക്കുക |
| Bill report | تقرير فاتورة | बिल रिपोर्ट | ബിൽ റിപ്പോർട്ട് |
| Itemised bill total | إجمالي الفاتورة المفصلة | विस्तृत बिल का कुल | ഇനംതിരിച്ച ബിൽ തുക |
| Estimate calculation | طريقة حساب التقدير | अनुमान की गणना | കണക്കുകൂട്ടൽ രീതി |
| Deductible applied first | المبلغ المقتطع أولًا | पहले कटौती योग्य राशि लागू | ആദ്യം ഡിഡക്റ്റിബിൾ കുറയ്ക്കുക |
| Amount remaining after deductible | المبلغ المتبقي بعد الخصم | कटौती के बाद बची राशि | ഡിഡക്റ്റിബിളിന് ശേഷമുള്ള തുക |
| Estimated covered amount ({percent}%) | المبلغ التقديري المغطى ({percent}٪) | अनुमानित कवर राशि ({percent}%) | കണക്കാക്കിയ പരിരക്ഷിത തുക ({percent}%) |
| Estimated patient pays | المبلغ التقديري الذي يدفعه المريض | अनुमानित रोगी भुगतान | കണക്കാക്കിയ രോഗി നൽകേണ്ട തുക |
| Unable to load saved insurance policies. | تعذر تحميل وثائق التأمين المحفوظة. | सहेजी गई बीमा पॉलिसियाँ लोड नहीं हो सकीं। | സംരക്ഷിച്ച ഇൻഷുറൻസ് പോളിസികൾ ലോഡ് ചെയ്യാനായില്ല. |
| Unable to save the insurance policy. | تعذر حفظ وثيقة التأمين. | बीमा पॉलिसी सहेजी नहीं जा सकी। | ഇൻഷുറൻസ് പോളിസി സംരക്ഷിക്കാനായില്ല. |
| Allow pop-ups to view the insurance document. | اسمح بالنوافذ المنبثقة لعرض مستند التأمين. | बीमा दस्तावेज़ देखने के लिए पॉप-अप की अनुमति दें। | ഇൻഷുറൻസ് രേഖ കാണാൻ പോപ്പ്-അപ്പുകൾ അനുവദിക്കുക. |
| Add insurance policy | إضافة وثيقة تأمين | बीमा पॉलिसी जोड़ें | ഇൻഷുറൻസ് പോളിസി ചേർക്കുക |
| Reading policy document... | جارٍ قراءة وثيقة التأمين... | बीमा दस्तावेज़ पढ़ा जा रहा है... | ഇൻഷുറൻസ് രേഖ വായിക്കുന്നു... |
| This does not look like an insurance policy | لا يبدو هذا مستند تأمين | यह बीमा पॉलिसी जैसा नहीं दिखता | ഇത് ഇൻഷുറൻസ് പോളിസിയാണെന്ന് തോന്നുന്നില്ല |
| Try again | حاول مرة أخرى | फिर से प्रयास करें | വീണ്ടും ശ്രമിക്കുക |
| Insurance document preview | معاينة مستند التأمين | बीमा दस्तावेज़ का पूर्वावलोकन | ഇൻഷുറൻസ് രേഖയുടെ പ്രിവ്യൂ |
| Entered by you, from your policy | أدخلتها أنت من وثيقتك | आपके द्वारा अपनी पॉलिसी से दर्ज किया गया | നിങ്ങളുടെ പോളിസിയിൽ നിന്ന് നിങ്ങൾ നൽകിയ വിവരം |
| Coverage percent | نسبة التغطية | कवरेज प्रतिशत | പരിരക്ഷ ശതമാനം |
| Deductible | المبلغ المقتطع | कटौती योग्य राशि | ഡിഡക്റ്റിബിൾ |
| Copay | المشاركة في الدفع | सह-भुगतान | കോ-പേ |
| Save policy | حفظ الوثيقة | पॉलिसी सहेजें | പോളിസി സംരക്ഷിക്കുക |
| Insurer | شركة التأمين | बीमाकर्ता | ഇൻഷുറർ |
| Plan | الخطة | योजना | പ്ലാൻ |
| Policyholder | حامل الوثيقة | पॉलिसीधारक | പോളിസി ഉടമ |
| Organization | المؤسسة | संस्था | സ്ഥാപനം |
| Policy number | رقم الوثيقة | पॉलिसी नंबर | പോളിസി നമ്പർ |
| Member ID | رقم العضوية | सदस्य ID | അംഗ ഐഡി |
| Start date | تاريخ البدء | आरंभ तिथि | ആരംഭ തീയതി |
| End date | تاريخ الانتهاء | समाप्ति तिथि | അവസാന തീയതി |
| Insurer phone | هاتف شركة التأمين | बीमाकर्ता का फ़ोन | ഇൻഷുററുടെ ഫോൺ |
| Insurer not listed | شركة التأمين غير مدرجة | बीमाकर्ता सूचीबद्ध नहीं है | ഇൻഷുററെ പട്ടികപ്പെടുത്തിയിട്ടില്ല |
| Plan not listed | الخطة غير مدرجة | योजना सूचीबद्ध नहीं है | പ്ലാൻ പട്ടികപ്പെടുത്തിയിട്ടില്ല |
| Valid until | صالحة حتى | इस तारीख तक मान्य | കാലാവധി |
| Dates not listed | التواريخ غير مدرجة | तारीखें सूचीबद्ध नहीं हैं | തീയതികൾ പട്ടികപ്പെടുത്തിയിട്ടില്ല |
| Active | سارية | सक्रिय | സജീവം |
| Expired | منتهية | समाप्त | കാലഹരണപ്പെട്ടു |
| Show | إظهار | दिखाएँ | കാണിക്കുക |
| Hide | إخفاء | छिपाएँ | മറയ്ക്കുക |
| View document | عرض المستند | दस्तावेज़ देखें | രേഖ കാണുക |
| Edit | تعديل | संपादित करें | തിരുത്തുക |
| Delete | حذف | हटाएँ | ഇല്ലാതാക്കുക |
| Delete this insurance policy and its document? | هل تريد حذف وثيقة التأمين ومستندها؟ | क्या यह बीमा पॉलिसी और इसका दस्तावेज़ हटाएँ? | ഈ ഇൻഷുറൻസ് പോളിസിയും രേഖയും ഇല്ലാതാക്കണോ? |
| Hayat AI stores what you confirmed. It does not check your cover with the insurer. | يحفظ Hayat AI ما أكدته. ولا يتحقق من تغطيتك لدى شركة التأمين. | Hayat AI आपके द्वारा पुष्टि की गई जानकारी सहेजता है। यह बीमाकर्ता से आपके कवरेज की जाँच नहीं करता। | നിങ്ങൾ സ്ഥിരീകരിച്ച വിവരങ്ങളാണ് Hayat AI സൂക്ഷിക്കുന്നത്. ഇൻഷുററുമായി നിങ്ങളുടെ പരിരക്ഷ പരിശോധിക്കുന്നില്ല. |
| Include insurance on the card | إضافة التأمين إلى البطاقة | कार्ड पर बीमा शामिल करें | കാർഡിൽ ഇൻഷുറൻസ് ഉൾപ്പെടുത്തുക |
| View insurance | عرض التأمين | बीमा देखें | ഇൻഷുറൻസ് കാണുക |
| Edit details | تعديل التفاصيل | विवरण संपादित करें | വിവരങ്ങൾ തിരുത്തുക |
| No details saved yet. | لم يتم حفظ أي تفاصيل بعد. | अभी कोई विवरण सहेजा नहीं गया है। | വിവരങ്ങളൊന്നും ഇതുവരെ സംരക്ഷിച്ചിട്ടില്ല. |
| Add your details | أضف تفاصيلك | अपना विवरण जोड़ें | നിങ്ങളുടെ വിവരങ്ങൾ ചേർക്കുക |
| Your details | تفاصيلك | आपका विवरण | നിങ്ങളുടെ വിവരങ്ങൾ |
| Add insurance in Care | أضف التأمين في الرعاية | देखभाल में बीमा जोड़ें | പരിചരണത്തിൽ ഇൻഷുറൻസ് ചേർക്കുക |
| Discard your unsaved changes? | هل تريد تجاهل التغييرات غير المحفوظة؟ | क्या आप बिना सहेजे बदलाव छोड़ना चाहते हैं? | സംരക്ഷിക്കാത്ത മാറ്റങ്ങൾ ഉപേക്ഷിക്കണോ? |
| Close | إغلاق | बंद करें | അടയ്ക്കുക |
| Status | الحالة | स्थिति | നില |
| Insurance | التأمين | बीमा | ഇൻഷുറൻസ് |
| No insurance saved | لا يوجد تأمين محفوظ | कोई बीमा सहेजा नहीं गया है | ഇൻഷുറൻസ് സംരക്ഷിച്ചിട്ടില്ല |
| From your saved policy. Not verified by Hayat AI. | من وثيقتك المحفوظة. لم يتحقق Hayat AI منها. | आपकी सहेजी गई पॉलिसी से। Hayat AI ने इसकी पुष्टि नहीं की है। | നിങ്ങൾ സംരക്ഷിച്ച പോളിസിയിൽ നിന്ന്. Hayat AI ഇത് സ്ഥിരീകരിച്ചിട്ടില്ല. |
| Show approximate address | عرض العنوان التقريبي | अनुमानित पता दिखाएँ | ഏകദേശ വിലാസം കാണിക്കുക |
| Loading approximate address... | جارٍ تحميل العنوان التقريبي... | अनुमानित पता लोड हो रहा है... | ഏകദേശ വിലാസം ലോഡ് ചെയ്യുന്നു... |
| Address not available | العنوان غير متاح | पता उपलब्ध नहीं है | വിലാസം ലഭ്യമല്ല |
| Approximate address near the pin, from OpenStreetMap. It may not match the entrance. | عنوان تقريبي بالقرب من الدبوس من OpenStreetMap. قد لا يطابق المدخل. | पिन के पास OpenStreetMap से अनुमानित पता। यह प्रवेश द्वार से मेल न खाए। | പിൻ സമീപത്തുള്ള OpenStreetMap-ൽ നിന്നുള്ള ഏകദേശ വിലാസം. പ്രവേശന കവാടവുമായി പൊരുത്തപ്പെടണമെന്നില്ല. |

Stage 11 wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| Found in the registered medicines list ({date}) | موجود في قائمة الأدوية المسجلة ({date}) | पंजीकृत दवाओं की सूची में मिला ({date}) | രജിസ്റ്റർ ചെയ്ത മരുന്നുകളുടെ പട്ടികയിൽ കണ്ടെത്തി ({date}) |
| Not found in this list. Names can differ between brand and generic. Ask your pharmacist. | لم يتم العثور عليه في هذه القائمة. قد تختلف الأسماء بين العلامة التجارية والاسم العلمي. اسأل الصيدلي. | इस सूची में नहीं मिला। ब्रांड और जेनेरिक नाम अलग हो सकते हैं। अपने फार्मासिस्ट से पूछें। | ഈ പട്ടികയിൽ കണ്ടെത്തിയില്ല. ബ്രാൻഡ് പേരും ജനറിക് പേരും വ്യത്യസ്തമായിരിക്കാം. ഫാർമസിസ്റ്റിനോട് ചോദിക്കുക. |
| Could not check the list right now | تعذر التحقق من القائمة الآن | अभी सूची की जाँच नहीं हो सकी | ഇപ്പോൾ പട്ടിക പരിശോധിക്കാനായില്ല |
| Source: {title}, {date} | المصدر: {title}، {date} | स्रोत: {title}, {date} | ഉറവിടം: {title}, {date} |

Conversational chatbot wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| chat.hayat / chat.you / chat.typing | حياة / أنت / حياة تكتب... | हयात / आप / हयात लिख रही है... | ഹയാത്ത് / നിങ്ങൾ / ഹയാത്ത് ടൈപ്പ് ചെയ്യുന്നു... |
| chat.welcome | مرحبًا، أنا حياة. يمكنني شرح تقاريرك، ومساعدتك على فهم المصطلحات الطبية والاستعداد لأسئلة طبيبك، وتعريفك بكيفية استخدام التطبيق. | नमस्ते, मैं हयात हूँ। मैं आपकी रिपोर्ट समझा सकती हूँ, चिकित्सा शब्दों को समझने और डॉक्टर से पूछने के लिए प्रश्न तैयार करने में मदद कर सकती हूँ, और ऐप का उपयोग बतला सकती हूँ। | നമസ്കാരം, ഞാൻ ഹയാത്ത്. നിങ്ങളുടെ റിപ്പോർട്ടുകൾ വിശദീകരിക്കാനും മെഡിക്കൽ പദങ്ങൾ മനസ്സിലാക്കാനും ഡോക്ടറോട് ചോദിക്കാനുള്ള ചോദ്യങ്ങൾ തയ്യാറാക്കാനും ആപ്പ് ഉപയോഗിക്കാൻ സഹായിക്കാനും എനിക്ക് കഴിയും. |
| chat.starters.report / chat.starters.outsideRange | ماذا يقول تقريري؟ / ما القيم التي تقع خارج النطاق في تقريري؟ | मेरी रिपोर्ट क्या कहती है? / मेरी रिपोर्ट में कौन-से मान दी गई सीमा से बाहर हैं? | എന്റെ റിപ്പോർട്ട് എന്താണ് പറയുന്നത്? / എന്റെ റിപ്പോർട്ടിലെ പരിധിക്ക് പുറത്തുള്ള മൂല്യങ്ങൾ ഏതൊക്കെയാണ്? |
| chat.starters.medicalWord / chat.starters.doctorQuestions / chat.starters.insurance | اشرح مصطلحًا طبيًا / ماذا أسأل طبيبي؟ / كيف أضيف التأمين؟ | किसी चिकित्सा शब्द को समझाएँ / मुझे अपने डॉक्टर से क्या पूछना चाहिए? / मैं अपना बीमा कैसे जोड़ूँ? | ഒരു മെഡിക്കൽ പദം വിശദീകരിക്കുക / ഡോക്ടറോട് ഞാൻ എന്താണ് ചോദിക്കേണ്ടത്? / എന്റെ ഇൻഷുറൻസ് എങ്ങനെ ചേർക്കാം? |
| chat.fromReports / chat.generalInfo / chat.appHelp | من تقاريرك / معلومات عامة / مساعدة التطبيق | आपकी रिपोर्टों से / सामान्य जानकारी / ऐप सहायता | നിങ്ങളുടെ റിപ്പോർട്ടുകളിൽ നിന്ന് / പൊതുവായ വിവരം / ആപ്പ് സഹായം |
| chat.suggestions | يمكنك أيضًا السؤال عن | आप यह भी पूछ सकते हैं | ഇതും ചോദിക്കാം |
| chat.supportMessage | آسفة لأنك تشعر بهذا. أنت تستحق الدعم الآن. تواصل مع شخص تثق به، أو اتصل بـ {ambulance} أو {police} إذا كنت في خطر. | मुझे दुख है कि आप ऐसा महसूस कर रहे हैं। आपको अभी सहारे की ज़रूरत है और आप इसके हकदार हैं। किसी भरोसेमंद व्यक्ति से संपर्क करें, या खतरे में हों तो {ambulance} या {police} पर कॉल करें। | നിങ്ങൾക്ക് ഇങ്ങനെ തോന്നുന്നതിൽ എനിക്ക് വിഷമമുണ്ട്. ഇപ്പോൾ നിങ്ങൾക്ക് പിന്തുണ ലഭിക്കണം. വിശ്വസിക്കുന്ന ഒരാളെ ബന്ധപ്പെടുക, അപകടത്തിലാണെങ്കിൽ {ambulance} അല്ലെങ്കിൽ {police} വിളിക്കുക. |
| chat.characterCount / chat.copy / chat.copied / chat.copyFailed | {count}/500 / نسخ / تم النسخ / تعذر نسخ الإجابة. | {count}/500 / कॉपी करें / कॉपी हो गया / उत्तर कॉपी नहीं हो सका। | {count}/500 / പകർത്തുക / പകർത്തി / മറുപടി പകർത്താനായില്ല. |
| chat.mic / chat.stopListening / chat.listening / chat.voiceNote | الإدخال الصوتي / إيقاف الاستماع / جارٍ الاستماع... / يعتمد الإدخال الصوتي على المتصفح واللغة. | आवाज़ से लिखें / सुनना बंद करें / सुना जा रहा है... / आवाज़ से लिखना आपके ब्राउज़र और भाषा पर निर्भर करता है। | ശബ്ദം ഉപയോഗിച്ച് ടൈപ്പ് ചെയ്യുക / കേൾക്കുന്നത് നിർത്തുക / കേൾക്കുന്നു... / ശബ്ദം ഉപയോഗിച്ചുള്ള ടൈപ്പിംഗ് ബ്രൗസറിനെയും ഭാഷയെയും ആശ്രയിച്ചിരിക്കുന്നു. |
| chat.reportAnswerClosing / chat.generalClosing | ناقش هذا مع طبيبك. / اسأل طبيبك أو الصيدلي. | इस बारे में अपने डॉक्टर से चर्चा करें। / अपने डॉक्टर या फार्मासिस्ट से पूछें। | ഇത് ഡോക്ടറുമായി ചർച്ച ചെയ്യുക. / ഡോക്ടറോടോ ഫാർമസിസ്റ്റിനോടോ ചോദിക്കുക. |
| chat.guardDeclined | لا أستطيع المساعدة في هذا الطلب. يمكنني مساعدتك في إعداد أسئلة تطرحها على طبيبك. | मैं इस अनुरोध में मदद नहीं कर सकती। मैं आपके डॉक्टर से पूछने के लिए प्रश्न तैयार करने में मदद कर सकती हूँ। | ആ അഭ്യർത്ഥനയിൽ സഹായിക്കാനാവില്ല. ഡോക്ടറോട് ചോദിക്കാനുള്ള ചോദ്യങ്ങൾ തയ്യാറാക്കാൻ ഞാൻ സഹായിക്കാം. |
| chat.disclaimer | قد تخطئ حياة. إنها تشرح المعلومات وليست نصيحة طبية. في الطوارئ اتصل بـ 998 أو 999. | हयात से गलती हो सकती है। यह जानकारी समझाती है, चिकित्सा सलाह नहीं देती। आपातकाल में 998 या 999 पर कॉल करें। | ഹയാത്തിന് പിഴവുകൾ സംഭവിക്കാം. ഇത് വിവരങ്ങൾ വിശദീകരിക്കുന്നതാണ്, മെഡിക്കൽ ഉപദേശമല്ല. അടിയന്തരാവസ്ഥയിൽ 998 അല്ലെങ്കിൽ 999 വിളിക്കുക. |

Saved-conversation interface wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| chat.history / chat.closeHistory / chat.newChat | سجل المحادثات / إغلاق سجل المحادثات / محادثة جديدة | चैट इतिहास / चैट इतिहास बंद करें / नई चैट | ചാറ്റ് ചരിത്രം / ചാറ്റ് ചരിത്രം അടയ്ക്കുക / പുതിയ ചാറ്റ് |
| chat.searchConversations / chat.today / chat.yesterday / chat.earlier | البحث في المحادثات / اليوم / أمس / سابقًا | चैट खोजें / आज / कल / पहले | ചാറ്റുകൾ തിരയുക / ഇന്ന് / ഇന്നലെ / മുമ്പ് |
| chat.rename / chat.deleteConversation / chat.renamePrompt | إعادة تسمية / حذف / أدخل اسمًا جديدًا للمحادثة | नाम बदलें / हटाएँ / चैट के लिए नया नाम दर्ज करें | പേര് മാറ്റുക / ഇല്ലാതാക്കുക / ചാറ്റിന് പുതിയ പേര് നൽകുക |
| chat.deleteConfirm / chat.noConversations / chat.emptyConversation | هل تريد حذف هذه المحادثة ورسائلها؟ / لم يتم العثور على محادثات. / لا توجد رسائل بعد | क्या आप यह चैट और इसके संदेश हटाना चाहते हैं? / कोई चैट नहीं मिली। / अभी कोई संदेश नहीं | ഈ ചാറ്റും സന്ദേശങ്ങളും ഇല്ലാതാക്കണോ? / ചാറ്റുകളൊന്നും കണ്ടെത്തിയില്ല. / സന്ദേശങ്ങളൊന്നുമില്ല |
| chat.conversationMenu | إجراءات المحادثة | चैट विकल्प | ചാറ്റ് പ്രവർത്തനങ്ങൾ |
| chat.conversationNotFound / chat.renameFailed / chat.deleteFailed | لم يتم العثور على المحادثة. / تعذرت إعادة تسمية المحادثة. / تعذر حذف المحادثة. | चैट नहीं मिली। / चैट का नाम नहीं बदला जा सका। / चैट हटाई नहीं जा सकी। | ചാറ്റ് കണ്ടെത്താനായില്ല. / ചാറ്റിന്റെ പേര് മാറ്റാനായില്ല. / ചാറ്റ് ഇല്ലാതാക്കാനായില്ല. |
| chat.welcomeTitle / chat.attach | مساعدك الصحي / إضافة مرفق | आपका स्वास्थ्य सहायक / अटैचमेंट जोड़ें | നിങ്ങളുടെ ആരോഗ്യ സഹായി / അറ്റാച്ച്മെന്റ് ചേർക്കുക |
| chat.uploadFile / chat.takePhoto | تحميل ملف / التقاط صورة | फ़ाइल अपलोड करें / फ़ोटो लें | ഫയൽ അപ്‌ലോഡ് ചെയ്യുക / ഫോട്ടോ എടുക്കുക |
| chat.tooltipCopy / chat.tooltipReadAloud / chat.tooltipStopReadAloud | نسخ الإجابة / قراءة بصوت عالٍ / إيقاف القراءة بصوت عالٍ | उत्तर कॉपी करें / ज़ोर से पढ़ें / पढ़ना रोकें | മറുപടി പകർത്തുക / ഉച്ചത്തിൽ വായിക്കുക / വായന നിർത്തുക |
| navigation.reports / navigation.more | المستندات / المزيد | दस्तावेज़ / और | രേഖകൾ / കൂടുതൽ |
| home.uploadAction | تحميل | अपलोड | അപ്‌ലോഡ് |
| reports.valuesConfirmed / reports.editValues | تم تأكيد القيم / تعديل القيم | मानों की पुष्टि हो गई / मान संपादित करें | മൂല്യങ്ങൾ സ്ഥിരീകരിച്ചു / മൂല്യങ്ങൾ തിരുത്തുക |
| reports.openInChat / reports.delete | فتح في المحادثة / حذف | चैट में खोलें / हटाएँ | ചാറ്റിൽ തുറക്കുക / ഇല്ലാതാക്കുക |
| reports.deleteConfirm / reports.deleteFailed | هل تريد حذف هذا المستند؟ لا يمكن التراجع عن ذلك. / تعذر حذف هذا المستند. يرجى المحاولة مرة أخرى. | क्या आप यह दस्तावेज़ हटाना चाहते हैं? इसे वापस नहीं किया जा सकता। / दस्तावेज़ हटाया नहीं जा सका। कृपया फिर से प्रयास करें। | ഈ രേഖ ഇല്ലാതാക്കണോ? ഇത് തിരികെ ലഭിക്കില്ല. / രേഖ ഇല്ലാതാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| reports.openDocument / reports.explanationTitle / reports.explanationActions | فتح المستند / شرح المستند / إجراءات الشرح | दस्तावेज़ खोलें / दस्तावेज़ की व्याख्या / व्याख्या के विकल्प | രേഖ തുറക്കുക / രേഖയുടെ വിശദീകരണം / വിശദീകരണ പ്രവർത്തനങ്ങൾ |
| reports.trackSteps | تتبّع خطواتي | मेरे कदम ट्रैक करें | എന്റെ ഘട്ടങ്ങൾ പിന്തുടരുക |
| chat.invalidFileType / chat.fileTooLarge | اختر ملف JPG أو PNG أو PDF. / يجب ألا يتجاوز حجم الملف 10 ميغابايت. | JPG, PNG या PDF फ़ाइल चुनें। / फ़ाइल 10 MB या उससे छोटी होनी चाहिए। | JPG, PNG, അല്ലെങ്കിൽ PDF ഫയൽ തിരഞ്ഞെടുക്കുക. / ഫയലിന്റെ വലുപ്പം 10 MB അല്ലെങ്കിൽ അതിൽ കുറവായിരിക്കണം. |
| chat.dropDocument / chat.readingDocument / chat.documentDeleted | أفلت المستند هنا / جارٍ قراءة مستندك... / تم حذف هذا المستند. | अपना दस्तावेज़ यहाँ छोड़ें / आपका दस्तावेज़ पढ़ा जा रहा है... / यह दस्तावेज़ हटा दिया गया है। | രേഖ ഇവിടെ ഇടുക / നിങ്ങളുടെ രേഖ വായിക്കുന്നു... / ഈ രേഖ ഇല്ലാതാക്കി. |
| chat.explainMore / chat.demoStarter | هل تريد مني شرح أي شيء آخر؟ / تجريبي | क्या आप चाहेंगे कि मैं कुछ और समझाऊँ? / डेमो | മറ്റെന്തെങ്കിലും വിശദീകരിക്കട്ടേ? / ഡെമോ |
| auth.invalidCredentials | البريد الإلكتروني أو كلمة المرور غير صحيحة | ईमेल या पासवर्ड गलत है | ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ് തെറ്റാണ് |

Family sharing and access log wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| navigation.family | العائلة | परिवार | കുടുംബം |
| family.shareButton / family.shareTitle | المشاركة مع العائلة / مشاركة هذا التقرير | परिवार के साथ साझा करें / यह रिपोर्ट साझा करें | കുടുംബവുമായി പങ്കിടുക / ഈ റിപ്പോർട്ട് പങ്കിടുക |
| family.invitation | شاركت تقريرًا معك على Hayat AI. سجّل الدخول باستخدام {email} لعرضه. | मैंने Hayat AI पर आपके साथ एक रिपोर्ट साझा की है। इसे देखने के लिए {email} से लॉग इन करें। | Hayat AI-യിൽ ഞാൻ നിങ്ങളുമായി ഒരു റിപ്പോർട്ട് പങ്കിട്ടു. കാണാൻ {email} ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക. |
| family.email / family.includeOriginal / family.endDate | البريد الإلكتروني / تضمين المستند الأصلي / تاريخ انتهاء اختياري | ईमेल / मूल दस्तावेज़ शामिल करें / वैकल्पिक समाप्ति तिथि | ഇമെയിൽ / യഥാർത്ഥ രേഖ ഉൾപ്പെടുത്തുക / ഐച്ഛിക അവസാന തീയതി |
| family.consent | أفهم أن هذا الشخص سيتمكن من رؤية قيم هذا التقرير وشرحه حتى أوقف المشاركة. | मैं समझता/समझती हूँ कि साझा करना बंद करने तक यह व्यक्ति इस रिपोर्ट के मान और व्याख्या देख सकेगा। | പങ്കിടൽ നിർത്തുന്നതുവരെ ഈ വ്യക്തിക്ക് റിപ്പോർട്ടിലെ മൂല്യങ്ങളും വിശദീകരണവും കാണാനാകുമെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു. |
| family.inviteNote | يحتاج الشخص المدعو إلى حساب Hayat AI بهذا البريد الإلكتروني. لا ترسل Hayat AI رسائل بريد إلكتروني. | आमंत्रित व्यक्ति के पास इस ईमेल से Hayat AI खाता होना चाहिए। Hayat AI ईमेल नहीं भेजता। | ക്ഷണിക്കപ്പെട്ട വ്യക്തിക്ക് ഈ ഇമെയിലിൽ Hayat AI അക്കൗണ്ട് വേണം. Hayat AI ഇമെയിലുകൾ അയയ്ക്കുന്നില്ല. |
| family.share / family.sharing / family.shareFailed | مشاركة التقرير / جارٍ المشاركة... / تعذرت مشاركة هذا التقرير. يرجى المحاولة مرة أخرى. | रिपोर्ट साझा करें / साझा हो रहा है... / रिपोर्ट साझा नहीं हो सकी। कृपया फिर से प्रयास करें। | റിപ്പോർട്ട് പങ്കിടുക / പങ്കിടുന്നു... / റിപ്പോർട്ട് പങ്കിടാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| family.shared / family.copyInvitation / family.whatsapp | تمت مشاركة التقرير. أرسل هذه الدعوة إلى الشخص الذي دعوته. / نسخ الدعوة / المشاركة عبر واتساب | रिपोर्ट साझा की गई। यह निमंत्रण आमंत्रित व्यक्ति को भेजें। / निमंत्रण कॉपी करें / WhatsApp पर साझा करें | റിപ്പോർട്ട് പങ്കിട്ടു. ഈ ക്ഷണം ക്ഷണിക്കപ്പെട്ട വ്യക്തിക്ക് അയയ്ക്കുക. / ക്ഷണം പകർത്തുക / WhatsApp വഴി പങ്കിടുക |
| family.copyFailed / family.close / family.cancel | تعذر النسخ. يرجى المحاولة مرة أخرى. / إغلاق / إلغاء | कॉपी नहीं हो सका। कृपया फिर से प्रयास करें। / बंद करें / रद्द करें | പകർത്താനായില്ല. വീണ്ടും ശ്രമിക്കുക. / അടയ്ക്കുക / റദ്ദാക്കുക |
| family.loading / family.loadFailed | جارٍ التحميل... / تعذر تحميل المشاركة العائلية. يرجى المحاولة مرة أخرى. | लोड हो रहा है... / परिवार साझाकरण लोड नहीं हो सका। कृपया फिर से प्रयास करें। | ലോഡ് ചെയ്യുന്നു... / കുടുംബ പങ്കിടൽ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| family.revokeConfirm / family.revokeFailed | هل تريد إيقاف مشاركة هذا التقرير؟ سيفقد الشخص الآخر إمكانية الوصول. / تعذر إيقاف المشاركة. يرجى المحاولة مرة أخرى. | क्या इस रिपोर्ट को साझा करना बंद करें? दूसरे व्यक्ति की पहुँच समाप्त हो जाएगी। / साझाकरण बंद नहीं हो सका। कृपया फिर से प्रयास करें। | ഈ റിപ്പോർട്ട് പങ്കിടുന്നത് നിർത്തണോ? മറ്റേയാൾക്ക് പ്രവേശനം നഷ്ടപ്പെടും. / പങ്കിടൽ നിർത്താനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| family.sharedByMe / family.sharedWithMe / family.accessLog | شاركتها / مشاركة معي / سجل الوصول | मेरे द्वारा साझा / मेरे साथ साझा / पहुँच लॉग | ഞാൻ പങ്കിട്ടത് / എന്നോടൊപ്പം പങ്കിട്ടത് / പ്രവേശന രേഖ |
| family.noSharesByMe / family.noSharesWithMe | لم تشارك أي تقارير. / لم تتم مشاركة أي تقارير معك. | आपने कोई रिपोर्ट साझा नहीं की है। / आपके साथ कोई रिपोर्ट साझा नहीं की गई है। | നിങ്ങൾ റിപ്പോർട്ടുകളൊന്നും പങ്കിട്ടിട്ടില്ല. / നിങ്ങളുമായി റിപ്പോർട്ടുകളൊന്നും പങ്കിട്ടിട്ടില്ല. |
| navigation.about / navigation.settings | حول / الإعدادات | जानकारी / सेटिंग | വിവരം / ക്രമീകരണങ്ങൾ |
| errorBoundary.title / message / reload | حدث خطأ ما / تعذر على حياة AI عرض هذه الصفحة. لم يتم تغيير معلوماتك المحفوظة. / إعادة تحميل الصفحة | कुछ गड़बड़ हुई / Hayat AI यह पेज नहीं दिखा सका। आपकी सहेजी गई जानकारी में बदलाव नहीं हुआ है। / पेज फिर से लोड करें | ഒരു പ്രശ്നം സംഭവിച്ചു / ഈ പേജ് പ്രദർശിപ്പിക്കാൻ Hayat AI-യ്ക്ക് കഴിഞ്ഞില്ല. നിങ്ങളുടെ സംരക്ഷിച്ച വിവരങ്ങളിൽ മാറ്റമില്ല. / പേജ് വീണ്ടും ലോഡ് ചെയ്യുക |
| about.title / summary | حول حياة AI / تساعد حياة AI الأشخاص على فهم مستنداتهم الطبية وتنظيم الخطوات التالية. | Hayat AI के बारे में / Hayat AI लोगों को उनके चिकित्सा दस्तावेज़ समझने और अगले कदम व्यवस्थित करने में मदद करता है। | Hayat AI-യെക്കുറിച്ച് / മെഡിക്കൽ രേഖകൾ മനസ്സിലാക്കാനും അടുത്ത ഘട്ടങ്ങൾ ക്രമീകരിക്കാനും Hayat AI സഹായിക്കുന്നു. |
| about.doesTitle / does | ما الذي تفعله حياة AI / تشرح المعلومات من المستندات التي ترفعها وتؤكدها، وتساعدك على متابعة خطوات الإحالة، وتوفر أدوات تجريبية للعثور على المرافق والاستعداد لزيارة العيادة. | Hayat AI क्या करता है / यह आपके अपलोड और पुष्टि किए गए दस्तावेज़ों की जानकारी समझाता है, रेफ़रल चरणों का हिसाब रखने में मदद करता है, और सुविधाएँ खोजने तथा क्लिनिक विज़िट की तैयारी के लिए नमूना टूल देता है। | Hayat AI ചെയ്യുന്നത് / നിങ്ങൾ അപ്‌ലോഡ് ചെയ്ത് സ്ഥിരീകരിച്ച രേഖകളിലെ വിവരങ്ങൾ വിശദീകരിക്കുകയും റഫറൽ ഘട്ടങ്ങൾ പിന്തുടരാൻ സഹായിക്കുകയും സൗകര്യങ്ങൾ കണ്ടെത്താനും ക്ലിനിക് സന്ദർശനത്തിന് തയ്യാറെടുക്കാനും മാതൃകാ ഉപകരണങ്ങൾ നൽകുകയും ചെയ്യുന്നു. |
| about.notTitle / not | ما الذي لا تفعله حياة AI / لا تشخّص حياة AI ولا تقدم علاجًا ولا تتحقق من معلومات الأدوية لحالتك الشخصية، ولا تحل محل الطبيب أو خدمات الطوارئ. | Hayat AI क्या नहीं करता / Hayat AI निदान या उपचार नहीं देता, आपकी व्यक्तिगत स्थिति के लिए दवा की जानकारी सत्यापित नहीं करता, और डॉक्टर या आपातकालीन सेवा का विकल्प नहीं है। | Hayat AI ചെയ്യാത്തത് / Hayat AI രോഗനിർണയമോ ചികിത്സയോ നൽകുന്നില്ല, നിങ്ങളുടെ വ്യക്തിഗത സാഹചര്യത്തിനുള്ള മരുന്ന് വിവരങ്ങൾ പരിശോധിക്കുന്നില്ല, ഡോക്ടറിനോ അടിയന്തര സേവനത്തിനോ പകരമല്ല. |
| about.sourcesTitle / sources / sourceNote | مصادر البيانات وتواريخها / OpenStreetMap — الخريطة وتفاصيل المرافق، استعلام مباشر (تم الوصول في 8 نوفمبر 2026).؛ البيانات المفتوحة لوزارة الصحة ووقاية المجتمع — المواقع الجغرافية للمرافق الصحية، تاريخ النشر غير متوفر؛ تم الوصول في 8 نوفمبر 2026.؛ قائمة الأدوية المسجلة لدى وزارة الصحة — إصدار المصدر 2018. / قد تكون تفاصيل المرافق والقوائم الخارجية غير مكتملة أو قديمة. تحقق مباشرة من المرفق أو المصدر. | डेटा स्रोत और तारीखें / OpenStreetMap — नक्शा और सुविधा विवरण, लाइव क्वेरी (8 नवंबर 2026 को देखा गया)।; MOHAP ओपन डेटा — स्वास्थ्य सुविधाओं के भू-स्थान, प्रकाशन की तारीख उपलब्ध नहीं; 8 नवंबर 2026 को देखा गया।; MOHAP पंजीकृत दवाओं की सूची — स्रोत संस्करण 2018। / सुविधाओं का विवरण और बाहरी सूचियाँ अधूरी या पुरानी हो सकती हैं। सुविधा या स्रोत से सीधे पुष्टि करें। | ഡാറ്റ ഉറവിടങ്ങളും തീയതികളും / OpenStreetMap — മാപ്പും സൗകര്യ വിവരങ്ങളും, തത്സമയ തിരയൽ (2026 നവംബർ 8-ന് ലഭിച്ചത്).; MOHAP ഓപ്പൺ ഡാറ്റ — ആരോഗ്യ സൗകര്യങ്ങളുടെ ജിയോകോഡഡ് ലൊക്കേഷൻ, പ്രസിദ്ധീകരണ തീയതി ലഭ്യമല്ല; 2026 നവംബർ 8-ന് ലഭിച്ചത്.; MOHAP രജിസ്റ്റർ ചെയ്ത മരുന്നുകളുടെ പട്ടിക — ഉറവിട പതിപ്പ് 2018. / സൗകര്യ വിവരങ്ങളും ബാഹ്യ പട്ടികകളും അപൂർണ്ണമോ കാലഹരണപ്പെട്ടതോ ആയിരിക്കാം. സൗകര്യത്തെയോ ഉറവിടത്തെയോ നേരിട്ട് സ്ഥിരീകരിക്കുക. |
| about.storedTitle / stored | ما يتم تخزينه / قد يخزن حسابك ملفك الشخصي والمستندات التي رفعتها والقيم المؤكدة والشروحات والمحادثات والتذكيرات والمواعيد وتفاصيل التأمين وخطوات الإحالة وسجلات المشاركة والوصول. استخدم الإعدادات لتنزيل بيانات حسابك أو حذفها. | क्या सहेजा जाता है / आपके खाते में प्रोफ़ाइल, अपलोड किए गए दस्तावेज़ और पुष्टि किए गए मान, व्याख्याएँ, चैट, रिमाइंडर, अपॉइंटमेंट, बीमा विवरण, रेफ़रल चरण और साझाकरण/पहुँच रिकॉर्ड सहेजे जा सकते हैं। अपना डेटा डाउनलोड या हटाने के लिए सेटिंग का उपयोग करें। | സംരക്ഷിക്കുന്ന വിവരങ്ങൾ / നിങ്ങളുടെ അക്കൗണ്ടിൽ പ്രൊഫൈൽ, അപ്‌ലോഡ് ചെയ്ത രേഖകളും സ്ഥിരീകരിച്ച മൂല്യങ്ങളും, വിശദീകരണങ്ങൾ, ചാറ്റ്, ഓർമ്മപ്പെടുത്തലുകൾ, കൂടിക്കാഴ്ചകൾ, ഇൻഷുറൻസ് വിവരങ്ങൾ, റഫറൽ ഘട്ടങ്ങൾ, പങ്കിടൽ/പ്രവേശന രേഖകൾ എന്നിവ സൂക്ഷിക്കാം. ഡാറ്റ ഡൗൺലോഡ് ചെയ്യാനോ ഇല്ലാതാക്കാനോ ക്രമീകരണങ്ങൾ ഉപയോഗിക്കുക. |
| about.verifyTitle / verifyItems | عناصر يجب التحقق منها / حدود الخطورة السريرية — يجب التحقق منها مع طبيب؛ أوصاف الأدوية وآثارها الجانبية — يجب التحقق منها مع صيدلي أو مصدر دوائي موثوق؛ الترجمات العربية والهندية والمالايالامية — تحتاج إلى مراجعة متحدثين أصليين؛ قوائم عبارات الطوارئ بالعربية والهندية والمالايالامية — تحتاج إلى مراجعة متحدثين أصليين. | जिन चीज़ों की पुष्टि करनी है / क्लिनिकल खतरे की सीमाएँ — डॉक्टर से पुष्टि करें; दवा का विवरण और दुष्प्रभाव — फार्मासिस्ट या विश्वसनीय दवा स्रोत से पुष्टि करें; अरबी, हिंदी और मलयालम अनुवाद — स्थानीय भाषा बोलने वालों से पुष्टि करें; अरबी, हिंदी और मलयालम की आपातकालीन वाक्य-सूचियाँ — स्थानीय भाषा बोलने वालों से पुष्टि करें। | സ്ഥിരീകരിക്കേണ്ടവ / ക്ലിനിക്കൽ അപകട പരിധികൾ — ഡോക്ടറുമായി സ്ഥിരീകരിക്കണം; മരുന്നുകളുടെ വിവരണങ്ങളും പാർശ്വഫലങ്ങളും — ഫാർമസിസ്റ്റുമായോ വിശ്വസനീയ മരുന്ന് ഉറവിടവുമായോ സ്ഥിരീകരിക്കണം; അറബിക്, ഹിന്ദി, മലയാളം വിവർത്തനങ്ങൾ — മാതൃഭാഷ സംസാരിക്കുന്നവരുമായി സ്ഥിരീകരിക്കണം; അറബിക്, ഹിന്ദി, മലയാളം അടിയന്തര വാക്യ പട്ടികകൾ — മാതൃഭാഷ സംസാരിക്കുന്നവരുമായി സ്ഥിരീകരിക്കണം. |
| settings.preferences / yourData / exportDescription / download | التفضيلات / بياناتك / نزّل ملفك الشخصي وقيم التقارير المؤكدة والمواعيد والتذكيرات في ملف JSON. / تنزيل بياناتي | प्राथमिकताएँ / आपका डेटा / अपनी प्रोफ़ाइल, पुष्टि किए गए रिपोर्ट मान, अपॉइंटमेंट और रिमाइंडर JSON फ़ाइल के रूप में डाउनलोड करें। / मेरा डेटा डाउनलोड करें | മുൻഗണനകൾ / നിങ്ങളുടെ ഡാറ്റ / പ്രൊഫൈൽ, സ്ഥിരീകരിച്ച റിപ്പോർട്ട് മൂല്യങ്ങൾ, കൂടിക്കാഴ്ചകൾ, ഓർമ്മപ്പെടുത്തലുകൾ എന്നിവ JSON ഫയലായി ഡൗൺലോഡ് ചെയ്യുക. / എന്റെ ഡാറ്റ ഡൗൺലോഡ് ചെയ്യുക |
| settings.downloadSuccess / downloadFailed / working | أصبح تنزيل بياناتك جاهزًا. / تعذر تنزيل بياناتك. يرجى المحاولة مرة أخرى. / جارٍ التنفيذ... | आपका डेटा डाउनलोड तैयार है। / डेटा डाउनलोड नहीं हो सका। कृपया फिर से प्रयास करें। / काम हो रहा है... | നിങ്ങളുടെ ഡാറ്റ ഡൗൺലോഡ് തയ്യാറാണ്. / ഡാറ്റ ഡൗൺലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. / പ്രവർത്തിക്കുന്നു... |
| settings.deleteTitle / deleteDescription | حذف حسابك وجميع بياناتك / سيؤدي ذلك نهائيًا إلى حذف حسابك ومستنداتك وملفاتك ومحادثاتك وتذكيراتك ومواعيدك وتأمينك وبيانات المشاركة. قد تبقى إدخالات سجل الوصول مجهولة الهوية. | अपना खाता और सारा डेटा हटाएँ / इससे आपका खाता, दस्तावेज़ और फ़ाइलें, चैट, रिमाइंडर, अपॉइंटमेंट, बीमा और साझाकरण डेटा स्थायी रूप से हट जाएगा। अनाम पहुँच-लॉग प्रविष्टियाँ रह सकती हैं। | അക്കൗണ്ടും എല്ലാ ഡാറ്റയും ഇല്ലാതാക്കുക / ഇത് നിങ്ങളുടെ അക്കൗണ്ട്, രേഖകളും ഫയലുകളും, ചാറ്റുകൾ, ഓർമ്മപ്പെടുത്തലുകൾ, കൂടിക്കാഴ്ചകൾ, ഇൻഷുറൻസ്, പങ്കിടൽ ഡാറ്റ എന്നിവ ശാശ്വതമായി ഇല്ലാതാക്കും. അനാമധേയ പ്രവേശന രേഖകൾ ശേഷിക്കാം. |
| settings.typeToConfirm / confirmWord / deleteButton / deleteFailed | اكتب DELETE لتأكيد حذف الحساب. / DELETE / حذف حسابي وجميع بياناتي / تعذر حذف حسابك. يرجى المحاولة مرة أخرى. | खाता हटाने की पुष्टि के लिए DELETE लिखें। / DELETE / मेरा खाता और सारा डेटा हटाएँ / खाता हटाया नहीं जा सका। कृपया फिर से प्रयास करें। | അക്കൗണ്ട് ഇല്ലാതാക്കാൻ DELETE എന്ന് ടൈപ്പ് ചെയ്യുക. / DELETE / എന്റെ അക്കൗണ്ടും എല്ലാ ഡാറ്റയും ഇല്ലാതാക്കുക / അക്കൗണ്ട് ഇല്ലാതാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| home.loading | جارٍ تحميل لوحة المعلومات... | डैशबोर्ड लोड हो रहा है... | ഡാഷ്ബോർഡ് ലോഡ് ചെയ്യുന്നു... |
| care.loading | جارٍ تحميل معلومات الرعاية... | देखभाल की जानकारी लोड हो रही है... | പരിചരണ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു... |
| home.welcome / greetingMorning / greetingAfternoon / greetingEvening | مرحبًا / صباح الخير، {name} / مساء الخير، {name} / مساء الخير، {name} | स्वागत है / सुप्रभात, {name} / नमस्कार, {name} / शुभ संध्या, {name} | സ്വാഗതം / സുപ്രഭാതം, {name} / നമസ്കാരം, {name} / ശുഭ സായാഹ്നം, {name} |
| home.askHayat / askPlaceholder / askSend / quickActions | اسأل حياة / ما الذي تريد المساعدة فيه؟ / إرسال / إجراءات سريعة | Hayat से पूछें / आपको किस बारे में मदद चाहिए? / भेजें / त्वरित कार्रवाई | Hayat-നോട് ചോദിക്കുക / എന്ത് സഹായമാണ് വേണ്ടത്? / അയയ്ക്കുക / ദ്രുത പ്രവർത്തനങ്ങൾ |
| home.actions | رفع مستند؛ ابحث عن طبيب؛ ابحث عن صيدلية؛ أدويتي؛ أسئلة لطبيبي؛ استغاثة | दस्तावेज़ अपलोड करें; डॉक्टर खोजें; फार्मेसी खोजें; मेरी दवाएँ; डॉक्टर से पूछने के प्रश्न; SOS | രേഖ അപ്‌ലോഡ് ചെയ്യുക; ഡോക്ടറെ കണ്ടെത്തുക; ഫാർമസി കണ്ടെത്തുക; എന്റെ മരുന്നുകൾ; ഡോക്ടറോടുള്ള ചോദ്യങ്ങൾ; SOS |
| home.recentDocuments / noDocuments / noMedicinesToday | المستندات الأخيرة / ستظهر مستنداتك هنا بعد رفعها وتأكيدها. / لا توجد تذكيرات بالأدوية مجدولة لليوم. | हाल के दस्तावेज़ / अपलोड और पुष्टि करने के बाद आपके दस्तावेज़ यहाँ दिखाई देंगे। / आज के लिए कोई दवा रिमाइंडर निर्धारित नहीं है। | സമീപകാല രേഖകൾ / അപ്‌ലോഡ് ചെയ്ത് സ്ഥിരീകരിച്ചാൽ നിങ്ങളുടെ രേഖകൾ ഇവിടെ കാണിക്കും. / ഇന്ന് മരുന്ന് ഓർമ്മപ്പെടുത്തലുകളൊന്നും നിശ്ചയിച്ചിട്ടില്ല. |
| home.addMedicineReminder / viewMedicines / noAppointment / addAppointment / openCalendar | أضف تذكيرًا بدواء / عرض الأدوية / ليس لديك مواعيد قادمة. / أضف موعدًا / افتح التقويم | दवा रिमाइंडर जोड़ें / दवाएँ देखें / आपकी कोई आगामी अपॉइंटमेंट नहीं है। / अपॉइंटमेंट जोड़ें / कैलेंडर खोलें | മരുന്ന് ഓർമ്മപ്പെടുത്തൽ ചേർക്കുക / മരുന്നുകൾ കാണുക / വരാനിരിക്കുന്ന കൂടിക്കാഴ്ചകളില്ല. / കൂടിക്കാഴ്ച ചേർക്കുക / കലണ്ടർ തുറക്കുക |
| home.needsAttention / noAttention / outsidePrintedRange / askHayatAction | يحتاج إلى الانتباه / لا توجد قيم مؤكدة خارج النطاق المطبوع تحتاج إلى انتباهك. / خارج النطاق المطبوع في تقريرك / اسأل حياة عن تقاريرك | ध्यान देने योग्य / पुष्टि की गई रिपोर्टों में मुद्रित सीमा से बाहर कोई मान ध्यान देने योग्य नहीं है। / आपकी रिपोर्ट में मुद्रित सीमा से बाहर / अपनी रिपोर्ट के बारे में Hayat से पूछें | ശ്രദ്ധിക്കേണ്ടത് / സ്ഥിരീകരിച്ച റിപ്പോർട്ടുകളിൽ അച്ചടിച്ച പരിധിക്ക് പുറത്തുള്ള ശ്രദ്ധിക്കേണ്ട മൂല്യങ്ങളില്ല. / നിങ്ങളുടെ റിപ്പോർട്ടിൽ അച്ചടിച്ച പരിധിക്ക് പുറത്ത് / റിപ്പോർട്ടുകളെക്കുറിച്ച് Hayat-നോട് ചോദിക്കുക |
| home.insurance / noInsurance / addInsurance | التأمين / لم تتم إضافة وثيقة تأمين بعد. / أضف تأمينًا | बीमा / अभी कोई बीमा पॉलिसी नहीं जोड़ी गई है। / बीमा जोड़ें | ഇൻഷുറൻസ് / ഇതുവരെ ഇൻഷുറൻസ് പോളിസി ചേർത്തിട്ടില്ല. / ഇൻഷുറൻസ് ചേർക്കുക |
| chat.emptyActions | رفع مستند: أضف تقريرًا أو وصفة للمراجعة؛ ابحث عن طبيب: ابحث عن مستشفيات وعيادات قريبة؛ ابحث عن صيدلية أو مستشفى: تصفح المرافق التجريبية القريبة؛ اشرح مصطلحًا طبيًا: اسأل حياة عن مصطلح قرأته؛ أسئلة لطبيبي: حضّر أسئلة لزيارتك القادمة؛ كيف أستخدم حياة؟: احصل على مساعدة للتنقل في التطبيق | दस्तावेज़ अपलोड करें: समीक्षा के लिए रिपोर्ट या प्रिस्क्रिप्शन जोड़ें; डॉक्टर खोजें: पास के अस्पताल और क्लिनिक देखें; फार्मेसी या अस्पताल खोजें: पास की नमूना सुविधाएँ देखें; चिकित्सा शब्द समझें: देखे गए शब्द के बारे में Hayat से पूछें; डॉक्टर से पूछने के प्रश्न: अगली मुलाक़ात के लिए प्रश्न तैयार करें; Hayat का उपयोग कैसे करें?: ऐप में रास्ता खोजने में मदद पाएँ | രേഖ അപ്‌ലോഡ് ചെയ്യുക: പരിശോധിക്കാൻ റിപ്പോർട്ടോ കുറിപ്പടിയോ ചേർക്കുക; ഡോക്ടറെ കണ്ടെത്തുക: സമീപത്തെ ആശുപത്രികളും ക്ലിനിക്കുകളും നോക്കുക; ഫാർമസിയോ ആശുപത്രിയോ കണ്ടെത്തുക: സമീപത്തെ മാതൃകാ സൗകര്യങ്ങൾ കാണുക; മെഡിക്കൽ പദം വിശദീകരിക്കുക: കണ്ട പദത്തെക്കുറിച്ച് Hayat-നോട് ചോദിക്കുക; ഡോക്ടറോടുള്ള ചോദ്യങ്ങൾ: അടുത്ത സന്ദർശനത്തിനായി ചോദ്യങ്ങൾ തയ്യാറാക്കുക; Hayat എങ്ങനെ ഉപയോഗിക്കാം?: ആപ്പിൽ വഴി കണ്ടെത്താൻ സഹായം നേടുക |
| chat.starters.appHelp | كيف أستخدم حياة؟ | मैं Hayat का उपयोग कैसे करूँ? | Hayat എങ്ങനെ ഉപയോഗിക്കാം? |
| family.revoke / family.revoked / family.noExpiry | إلغاء المشاركة / تم إيقاف المشاركة / بلا تاريخ انتهاء | पहुँच हटाएँ / साझाकरण बंद किया गया / कोई समाप्ति तिथि नहीं | പങ്കിടൽ പിൻവലിക്കുക / പങ്കിടൽ നിർത്തി / അവസാന തീയതിയില്ല |
| family.sharedBy / family.openReadOnly | مشاركة من {name} / فتح للقراءة فقط | {name} ने साझा किया / केवल पढ़ने के लिए खोलें | {name} പങ്കിട്ടത് / വായനയ്ക്കായി തുറക്കുക |
| family.noAccessLog / family.who / family.what / family.report / family.when / family.owner | لا يوجد نشاط وصول بعد. / من / ماذا / التقرير / متى / مالك التقرير | अभी कोई पहुँच गतिविधि नहीं है। / किसने / क्या / रिपोर्ट / कब / रिपोर्ट का मालिक | പ്രവേശന പ്രവർത്തനങ്ങളൊന്നുമില്ല. / ആര് / എന്ത് / റിപ്പോർട്ട് / എപ്പോൾ / റിപ്പോർട്ട് ഉടമ |
| family.actions.share_created / family.actions.share_revoked | تمت مشاركة تقرير / تم إيقاف مشاركة تقرير | रिपोर्ट साझा की / रिपोर्ट साझा करना बंद किया | റിപ്പോർട്ട് പങ്കിട്ടു / റിപ്പോർട്ട് പങ്കിടൽ നിർത്തി |
| family.actions.report_viewed / family.actions.sos_contact_opened | تم عرض تقرير مشارك / تم فتح جهة اتصال الطوارئ | साझा रिपोर्ट देखी / SOS संपर्क खोला | പങ്കിട്ട റിപ്പോർട്ട് കണ്ടു / SOS ബന്ധപ്പെടൽ തുറന്നു |
| family.sharedBanner | تمت المشاركة من {name}. للقراءة فقط. يمكن للمالك إيقاف المشاركة في أي وقت. | {name} ने साझा किया। केवल पढ़ने के लिए। मालिक किसी भी समय साझाकरण रोक सकता है। | {name} പങ്കിട്ടത്. വായനയ്ക്ക് മാത്രം. ഉടമയ്ക്ക് എപ്പോൾ വേണമെങ്കിലും പങ്കിടൽ നിർത്താം. |
| family.viewActions / family.accessEnded | إجراءات التقرير المشارك / انتهى الوصول | साझा रिपोर्ट के कार्य / पहुँच समाप्त | പങ്കിട്ട റിപ്പോർട്ടിന്റെ പ്രവർത്തനങ്ങൾ / പ്രവേശനം അവസാനിച്ചു |
| family.fileFailed / family.printedRange / family.noExplanation | تعذر تحميل المستند الأصلي. / النطاق المطبوع / لا يوجد شرح محفوظ. | मूल दस्तावेज़ लोड नहीं हो सका। / रिपोर्ट पर छपी सीमा / कोई सहेजी गई व्याख्या उपलब्ध नहीं है। | യഥാർത്ഥ രേഖ ലോഡ് ചെയ്യാനായില്ല. / റിപ്പോർട്ടിൽ അച്ചടിച്ച പരിധി / സംരക്ഷിച്ച വിശദീകരണം ലഭ്യമല്ല. |
| family.previous / family.next | السابق / التالي | पिछला / अगला | മുമ്പത്തേത് / അടുത്തത് |

Referral Tracker and Clinic Path wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| navigation.clinicPath | مسار العيادة | क्लिनिक पथ | ക്ലിനിക് പാത |
| referrals.title / referrals.subtitle | متتبع الإحالة / الخطوات والمستندات المذكورة في خطاب الإحالة المؤكد. | रेफ़रल ट्रैकर / आपके पुष्टि किए गए रेफ़रल पत्र में लिखे चरण और दस्तावेज़। | റഫറൽ ട്രാക്കർ / സ്ഥിരീകരിച്ച റഫറൽ കത്തിൽ പറഞ്ഞിരിക്കുന്ന ഘട്ടങ്ങളും രേഖകളും. |
| referrals.backToChat / referrals.stepsTitle | العودة إلى المحادثة / الخطوات في خطابك | चैट पर वापस जाएँ / आपके पत्र के चरण | ചാറ്റിലേക്ക് മടങ്ങുക / കത്തിലെ ഘട്ടങ്ങൾ |
| referrals.documentsToBring / referrals.loadFailed / referrals.saveFailed | المستندات التي يجب إحضارها / تعذر تحميل خطوات الإحالة. يرجى المحاولة مرة أخرى. / تعذر حفظ هذه الخطوة. يرجى المحاولة مرة أخرى. | साथ लाने वाले दस्तावेज़ / रेफ़रल चरण लोड नहीं हो सके। कृपया फिर से प्रयास करें। / यह चरण सहेजा नहीं जा सका। कृपया फिर से प्रयास करें। | കൊണ്ടുവരേണ്ട രേഖകൾ / റഫറൽ ഘട്ടങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. / ഈ ഘട്ടം സംരക്ഷിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക. |
| referrals.loading / referrals.progress / referrals.completed | جارٍ تحميل خطوات الإحالة... / تقدمك / اكتمل {done} من {total} | आपके रेफ़रल चरण लोड हो रहे हैं... / आपकी प्रगति / {total} में से {done} पूरे | റഫറൽ ഘട്ടങ്ങൾ ലോഡ് ചെയ്യുന്നു... / നിങ്ങളുടെ പുരോഗതി / {total} ൽ {done} പൂർത്തിയായി |
| referrals.noSteps / referrals.addStep / referrals.stepPlaceholder / referrals.saving | لم تُذكر خطوات في هذا الخطاب. يمكنك إضافة خطوة بنفسك. / إضافة خطوة بنفسي / أدخل خطوة / جارٍ الإضافة... | इस पत्र में कोई चरण नहीं दिया गया। आप अपना चरण जोड़ सकते हैं। / अपना चरण जोड़ें / एक चरण लिखें / जोड़ा जा रहा है... | ഈ കത്തിൽ ഘട്ടങ്ങളൊന്നും നൽകിയിട്ടില്ല. നിങ്ങൾക്ക് സ്വന്തം ഘട്ടം ചേർക്കാം. / എന്റെ ഘട്ടം ചേർക്കുക / ഒരു ഘട്ടം നൽകുക / ചേർക്കുന്നു... |
| referrals.notice | تحدد الخطوات بنفسك. الحالة المباشرة من العيادة مرحلة لاحقة. | आप स्वयं चरणों पर निशान लगाते हैं। क्लिनिक की लाइव स्थिति बाद के चरण में आएगी। | നിങ്ങൾ തന്നെയാണ് ഘട്ടങ്ങൾ അടയാളപ്പെടുത്തുന്നത്. ക്ലിനിക്കിൽ നിന്നുള്ള തത്സമയ സ്ഥിതി പിന്നീട് വരും. |
| clinicPath.title / clinicPath.banner | مسار العيادة / شاشات تصورية، غير متصلة بأي عيادة. | क्लिनिक पथ / ये अवधारणा स्क्रीन हैं, किसी क्लिनिक से जुड़ी नहीं हैं। | ക്ലിനിക് പാത / ആശയ രൂപത്തിലുള്ള സ്ക്രീനുകൾ; ഒരു ക്ലിനിക്കുമായും ബന്ധിപ്പിച്ചിട്ടില്ല. |
| clinicPath.screenNames | اختر احتياجاتك / اختر نوع الزيارة / مسارك / ماذا تقول | ज़रूरतें चुनें / विज़िट चुनें / आपका रास्ता / क्या कहें | ആവശ്യങ്ങൾ തിരഞ്ഞെടുക്കുക / സന്ദർശനം തിരഞ്ഞെടുക്കുക / നിങ്ങളുടെ പാത / എന്ത് പറയണം |
| clinicPath.needsTitle / clinicPath.needsHint | ما نوع الدعم الذي سيساعدك؟ / اختر ما قد يجعل زيارتك أسهل. | कौन-सी सहायता आपके काम आएगी? / वे विकल्प चुनें जिनसे आपकी विज़िट आसान हो। | ഏത് സഹായമാണ് നിങ്ങൾക്ക് ഉപകാരപ്പെടുക? / സന്ദർശനം എളുപ്പമാക്കുന്നവ തിരഞ്ഞെടുക്കുക. |
| clinicPath.needs wheelchair / hearing / vision / simple / interpreter | إمكانية وصول الكرسي المتحرك / دعم السمع / دعم البصر / لغة بسيطة / مترجم | व्हीलचेयर की सुविधा / सुनने में सहायता / देखने में सहायता / सरल भाषा / दुभाषिया | വീൽചെയർ സൗകര്യം / കേൾവിക്കുള്ള സഹായം / കാഴ്ചയ്ക്കുള്ള സഹായം / ലളിതമായ ഭാഷ / വിവർത്തകൻ |
| clinicPath.notSaved | هذا تصور فقط. لا يتم حفظ أي شيء أو إرساله. | यह केवल एक अवधारणा है। कुछ भी सहेजा या भेजा नहीं जाता। | ഇത് ആശയ മാതൃക മാത്രമാണ്. ഒന്നും സംരക്ഷിക്കുകയോ അയയ്ക്കുകയോ ഇല്ല. |
| clinicPath.visitTitle / clinicPath.visits | ما نوع هذه الزيارة؟ / موعد عام، فحص أو تصوير، موعد اختصاصي | यह किस प्रकार की विज़िट है? / सामान्य अपॉइंटमेंट, टेस्ट या स्कैन, विशेषज्ञ अपॉइंटमेंट | ഇത് ഏത് തരത്തിലുള്ള സന്ദർശനമാണ്? / സാധാരണ കൂടിക്കാഴ്ച, പരിശോധന അല്ലെങ്കിൽ സ്കാൻ, വിദഗ്ധ കൂടിക്കാഴ്ച |
| clinicPath.sampleClinic | عيادة تجريبية: Sample Clinic Dubai | नमूना क्लिनिक: Sample Clinic Dubai | മാതൃകാ ക്ലിനിക്: Sample Clinic Dubai |
| clinicPath.pathTitle / clinicPath.stages | مسار زيارة تجريبي / قبل الذهاب، عند الوصول، داخل العيادة، بعد الزيارة | एक नमूना विज़िट का रास्ता / जाने से पहले, पहुँचने पर, क्लिनिक में, बाद में | ഒരു മാതൃകാ സന്ദർശന പാത / പോകുന്നതിന് മുമ്പ്, എത്തുമ്പോൾ, ക്ലിനിക്കിൽ, ശേഷം |
| clinicPath.stageDetails.before | راجع تفاصيل الموعد في خطابك واجمع المستندات المذكورة فيه فقط. | अपने पत्र में अपॉइंटमेंट की जानकारी देखें और केवल सूचीबद्ध दस्तावेज़ साथ रखें। | കത്തിലെ കൂടിക്കാഴ്ചാ വിവരങ്ങൾ പരിശോധിച്ച് അതിൽ പറഞ്ഞ രേഖകൾ മാത്രം ശേഖരിക്കുക. |
| clinicPath.stageDetails.arriving | في Sample Clinic، اسأل مكتب الاستقبال عن مكان تسجيل الوصول. | Sample Clinic में, रिसेप्शन से पूछें कि पंजीकरण कहाँ करना है। | Sample Clinic-ൽ, രജിസ്റ്റർ ചെയ്യേണ്ട സ്ഥലം റിസപ്ഷനിൽ ചോദിക്കുക. |
| clinicPath.stageDetails.inside / after | أخبر فريق العيادة بالدعم الذي قد يساعدك أثناء الزيارة. / اسأل فريق العيادة عن الخطوة التالية ومكان العثور على التعليمات المكتوبة. | क्लिनिक टीम को बताएँ कि विज़िट के दौरान कौन-सी सहायता आपके काम आएगी। / क्लिनिक टीम से अगला चरण और लिखित निर्देशों की जगह पूछें। | സന്ദർശനത്തിനിടെ നിങ്ങൾക്ക് സഹായകരമായ കാര്യങ്ങൾ ക്ലിനിക് ടീമിനോട് പറയുക. / അടുത്ത ഘട്ടം എന്താണെന്നും എഴുത്തിലുള്ള നിർദ്ദേശങ്ങൾ എവിടെയാണെന്നും ക്ലിനിക് ടീമിനോട് ചോദിക്കുക. |
| clinicPath.deskTitle / clinicPath.deskSentences | ماذا تقول عند مكتب الاستقبال / مرحبًا. لدي موعد. / هل يمكنكم إخباري بمكان تسجيل الوصول؟ / أود المساعدة في فهم الخطوة التالية. | रिसेप्शन पर क्या कहें / नमस्ते। मेरी अपॉइंटमेंट है। / क्या आप बता सकते हैं कि मुझे कहाँ पंजीकरण करना है? / अगला चरण समझने में मुझे मदद चाहिए। | ഡെസ്കിൽ എന്ത് പറയണം / നമസ്കാരം. എനിക്ക് ഒരു കൂടിക്കാഴ്ചയുണ്ട്. / രജിസ്റ്റർ ചെയ്യേണ്ട സ്ഥലം പറഞ്ഞുതരുമോ? / അടുത്ത ഘട്ടം മനസ്സിലാക്കാൻ എനിക്ക് സഹായം വേണം. |
| clinicPath.previous / clinicPath.next | السابق / التالي | पिछला / अगला | മുമ്പത്തേത് / അടുത്തത് |

Place-finder wording needs native speaker review:

| Key | Arabic | Hindi | Malayalam |
|---|---|---|---|
| chat.findPlacesLeadIn | يمكنني مساعدتك في البحث باستخدام قوائم المرافق. | मैं सुविधा सूचियों में जगहें खोजने में मदद कर सकती हूँ। | സ്ഥാപനങ്ങളുടെ പട്ടികയിൽ സ്ഥലങ്ങൾ തിരയാൻ ഞാൻ സഹായിക്കാം. |
| places.locationPrivacy / places.shareLocation / places.locating | يُستخدم موقعك لهذا البحث فقط ولا يتم حفظه. / مشاركة موقعي لهذا البحث / جارٍ طلب موقعك... | आपकी लोकेशन केवल इस खोज के लिए उपयोग होती है और सहेजी नहीं जाती। / इस खोज के लिए मेरी लोकेशन साझा करें / आपकी लोकेशन का अनुरोध हो रहा है... | നിങ്ങളുടെ ലൊക്കേഷൻ ഈ തിരയലിന് മാത്രമാണ് ഉപയോഗിക്കുന്നത്; അത് സംരക്ഷിക്കില്ല. / ഈ തിരച്ചിലിനായി എന്റെ ലൊക്കേഷൻ പങ്കിടുക / നിങ്ങളുടെ ലൊക്കേഷൻ അഭ്യർത്ഥിക്കുന്നു... |
| places.searchAgain / places.chooseCity / places.locationUnavailable | البحث مرة أخرى / اختر مدينة / الموقع غير متاح. اختر مدينة للبحث بدلًا من ذلك. | फिर खोजें / एक शहर चुनें / लोकेशन उपलब्ध नहीं है। इसके बजाय खोजने के लिए कोई शहर चुनें। | വീണ്ടും തിരയുക / ഒരു നഗരം തിരഞ്ഞെടുക്കുക / ലൊക്കേഷൻ ലഭ്യമല്ല. പകരം തിരയാൻ ഒരു നഗരം തിരഞ്ഞെടുക്കുക. |
| places.searchFailed / places.noResults / places.loading | تعذر تحميل الأماكن. يرجى المحاولة مرة أخرى. / لا توجد أماكن تطابق عوامل التصفية. / جارٍ البحث في قوائم المرافق... | जगहें लोड नहीं हो सकीं। कृपया फिर प्रयास करें। / इन फ़िल्टर से मेल खाने वाली जगहें नहीं मिलीं। / सुविधा सूची में खोज हो रही है... | സ്ഥലങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക. / ഈ ഫിൽട്ടറുകൾക്ക് അനുയോജ്യമായ സ്ഥലങ്ങളില്ല. / സ്ഥാപനങ്ങളുടെ പട്ടികയിൽ തിരയുന്നു... |
| places.resultsTitle / places.licensedFacility / places.openStreetMap | أماكن قريبة / منشأة مرخصة / OpenStreetMap | पास की जगहें / लाइसेंस प्राप्त सुविधा / OpenStreetMap | സമീപത്തെ സ്ഥലങ്ങൾ / ലൈസൻസുള്ള സ്ഥാപനം / OpenStreetMap |
| places.distance / places.hoursNotListed | على بُعد {distance} كم / ساعات العمل غير مدرجة. اتصل للتأكد. | {distance} किमी दूर / समय सूचीबद्ध नहीं है। पुष्टि के लिए कॉल करें। | {distance} കി.മീ അകലെ / സമയം നൽകിയിട്ടില്ല. സ്ഥിരീകരിക്കാൻ വിളിക്കുക. |
| places.detailsMayBeIncomplete / places.openInMap | قد تكون ساعات العمل والتفاصيل غير مكتملة. اتصل للتأكد. / فتح في الخريطة | समय और विवरण अधूरे हो सकते हैं। पुष्टि के लिए कॉल करें। / मैप में खोलें | സമയവും വിവരങ്ങളും അപൂർണ്ണമായിരിക്കാം. സ്ഥിരീകരിക്കാൻ വിളിക്കുക. / മാപ്പിൽ തുറക്കുക |
| places.directions / places.call / places.addressUnavailable | الاتجاهات / اتصال / العنوان التقريبي غير متاح. | रास्ता / कॉल करें / अनुमानित पता उपलब्ध नहीं है। | ദിശകൾ / വിളിക്കുക / ഏകദേശ വിലാസം ലഭ്യമല്ല. |
| places.searchCity / places.loading / places.resultsTitle | البحث في {city} / جارٍ البحث في قوائم المرافق... / أماكن قريبة | {city} में खोजें / सुविधा सूची में खोज हो रही है... / पास की जगहें | {city}-യിൽ തിരയുക / സ്ഥാപനങ്ങളുടെ പട്ടികയിൽ തിരയുന്നു... / സമീപത്തെ സ്ഥലങ്ങൾ |
| places.openNow / places.closedNow / places.emergencyDepartment / places.placeNumber | مفتوح الآن / مغلق الآن / قسم الطوارئ / المكان {number} | अभी खुला है / अभी बंद है / आपातकालीन विभाग / जगह {number} | ഇപ്പോൾ തുറന്നിരിക്കുന്നു / ഇപ്പോൾ അടച്ചിരിക്കുന്നു / അത്യാഹിത വിഭാഗം / സ്ഥലം {number} |
| places.loadingAddress | جارٍ تحميل العنوان التقريبي... | अनुमानित पता लोड हो रहा है... | ഏകദേശ വിലാസം ലോഡ് ചെയ്യുന്നു... |
| places.cityNames: Dubai / Abu Dhabi / Sharjah / Ajman | دبي / أبو ظبي / الشارقة / عجمان | दुबई / अबू धाबी / शारजाह / अजमान | ദുബായ് / അബുദാബി / ഷാർജ / അജ്മാൻ |
| places.cityNames: Al Ain / Ras Al Khaimah / Fujairah / Umm Al Quwain | العين / رأس الخيمة / الفجيرة / أم القيوين | अल ऐन / रास अल खैमाह / फुजैराह / उम्म अल कुवैन | അൽ ഐൻ / റാസ് അൽ ഖൈമ / ഫുജൈറ / ഉമ്മുൽ ഖുവൈൻ |
| map.locationLabel / map.defaultLocation / map.foodDietaryFilter / map.foodPlanFilter / map.distanceFilter / map.anyDistance / map.within3km / map.within5km / map.within10km / map.within25km / map.types.wellness | البحث حسب الموقع / موقع الخريطة الافتراضي / تصنيف غذائي مُدرج / تصنيف خطة مُدرج / المسافة / أي مسافة / ضمن 3 كم / ضمن 5 كم / ضمن 10 كم / ضمن 25 كم / مرفق عافية مُدرج | स्थान से खोजें / मानचित्र का डिफ़ॉल्ट स्थान / सूचीबद्ध आहार टैग / सूचीबद्ध योजना टैग / दूरी / कोई भी दूरी / 3 किमी के भीतर / 5 किमी के भीतर / 10 किमी के भीतर / 25 किमी के भीतर / सूचीबद्ध वेलनेस स्थान | സ്ഥലം ഉപയോഗിച്ച് തിരയുക / മാപ്പിന്റെ ഡിഫോൾട്ട് സ്ഥലം / പട്ടികപ്പെടുത്തിയ ഭക്ഷണ ടാഗ് / പട്ടികപ്പെടുത്തിയ പ്ലാൻ ടാഗ് / ദൂരം / ഏത് ദൂരവും / 3 കിലോമീറ്ററിനുള്ളിൽ / 5 കിലോമീറ്ററിനുള്ളിൽ / 10 കിലോമീറ്ററിനുള്ളിൽ / 25 കിലോമീറ്ററിനുള്ളിൽ / പട്ടികപ്പെടുത്തിയ വെൽനെസ് കേന്ദ്രം |
| map.clinics | العيادات | क्लीनिक | ക്ലിനിക്കുകൾ |
| navigation.askHayat / explore / profileSettings | اسأل حياة / استكشف / الملف الشخصي والإعدادات | Hayat से पूछें / खोजें / प्रोफ़ाइल और सेटिंग | Hayat-നോട് ചോദിക്കുക / പര്യവേക്ഷണം / പ്രൊഫൈലും ക്രമീകരണങ്ങളും |
| home.familyJourneysTitle / openFamilyJourneys / noFamilyJourneys / familyJourneysLoadFailed / journeyProgress | رحلات الأسرة أولاً / افتح الأسرة أولاً / لا توجد رحلات عائلية محفوظة بعد. / تعذر تحميل رحلات الأسرة أولاً. / اكتمل {completed} من {total} خطوات | परिवार प्रथम की यात्राएँ / परिवार प्रथम खोलें / अभी कोई सहेजी गई पारिवारिक यात्रा नहीं है। / परिवार प्रथम की यात्राएँ लोड नहीं हो सकीं। / {total} में से {completed} चरण पूरे | Family First യാത്രകൾ / Family First തുറക്കുക / സംരക്ഷിച്ച കുടുംബ യാത്രകളൊന്നുമില്ല. / Family First യാത്രകൾ ലോഡ് ചെയ്യാനായില്ല. / {total} ൽ {completed} ഘട്ടങ്ങൾ പൂർത്തിയായി |
| settings.themeLabel / themeSystem / themeLight / themeDark | المظهر / حسب إعداد الجهاز / فاتح / داكن | थीम / डिवाइस सेटिंग के अनुसार / हल्की / गहरी | തീം / ഉപകരണ ക്രമീകരണം / ലൈറ്റ് / ഡാർക്ക് |

Navigation consolidation labels and new Ask Hayat empty-state actions need native speaker review:

| Area | Arabic | Hindi | Malayalam |
|---|---|---|---|
| sectionTabs navigation for Places, Wellness, Providers, My circle, Family I help, Tasks, Journeys, Passport, Insurance, Language and display, Privacy and consent, Accessibility, About, Consent ledger, Access log, and Data export and delete | See `sectionTabs` in `ar.json` | See `sectionTabs` in `hi.json` | See `sectionTabs` in `ml.json` |
| Home My day card and show-less control | See `home.myDayTitle`, `home.openMyDay`, and `home.showLess` in `ar.json` | See matching keys in `hi.json` | See matching keys in `ml.json` |
| Ask Hayat empty-state actions and medicine question starter | See `chat.emptyActions` and `chat.starters.medicineQuestion` in `ar.json` | See matching keys in `hi.json` | See matching keys in `ml.json` |
| Judge demo login/profile labels and map tile fallback notices | See `auth.judgeDemoLogin`, `auth.demoProfile`, and `map.mapStyleChanged`/`map.tilesUnavailable` in `ar.json` | See matching keys in `hi.json` | See matching keys in `ml.json` |
# Friend UI integration navigation labels
- `navigation.primaryNavigation` and `navigation.quickLinks` (Arabic, Hindi, Malayalam)

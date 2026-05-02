import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const textNodeOriginals = new WeakMap<Text, string>();
const elementAttributeOriginals = new WeakMap<HTMLElement, Partial<Record<'placeholder' | 'title' | 'aria-label', string>>>();

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.campaigns': 'Campaigns',
    'nav.volunteer': 'Volunteer',
    'nav.donate': 'Donate Now',
    'hero.title': 'Empowering Lives, Building Hope',
    'hero.subtitle': 'Supporting orphanages and elderly homes across India',
    'hero.donate': 'Donate Now',
    'hero.volunteer': 'Become a Volunteer',
    'stats.donations': 'Total Donations',
    'stats.children': 'Children Helped',
    'stats.volunteers': 'Active Volunteers',
    'stats.campaigns': 'Active Campaigns',
    'dashboard': 'Dashboard',
    'impact': 'Impact',
    'donate': 'Donate',
    'donations': 'Donations',
    'sponsorship': 'Sponsorship',
    'wishlist': 'Wishlist',
    'volunteers': 'Volunteers',
    'my tasks': 'My Tasks',
    'achievements': 'Achievements',
    'needs': 'Needs',
    'events': 'Events',
    'campaigns': 'Campaigns',
    'reports': 'Reports',
    'success stories': 'Success Stories',
    'transparency': 'Transparency',
    'beneficiaries': 'Beneficiaries',
    'users': 'Users',
    'approvals': 'Approvals',
    'settings': 'Settings',
    'my support': 'My Support',
    'requests': 'Requests',
    'announcements': 'Announcements',
    'admin': 'Admin Panel',
    'navbar.search': 'Search campaigns, donors, volunteers...',
    'navbar.notifications': 'Notifications',
    'navbar.no_notifications': 'No notifications yet.',
    'navbar.just_now': 'Just now',
    'navbar.profile': 'Profile',
    'navbar.logout': 'Logout',
    'chat.title': 'Umedh Assistant',
    'chat.status': 'Online • Responds instantly',
    'chat.quick_actions': 'Quick actions:',
    'chat.placeholder': 'Ask about donations, support, reports, campaigns...',
    'chat.open_dashboard': 'Open dashboard',
    'chat.get_support': 'Get support',
    'chat.clear': 'Clear chat',
    'chat.close': 'Close assistant',
    'support.need_help': 'Need Help?',
    'support.contact_team': 'Contact our support team',
    'support.get_support': 'Get Support',
    'donation.title': 'Make a Donation',
    'donation.subtitle': 'Your contribution is saved directly to Firebase',
    'donation.view_only': 'This page is view-only for non-donor accounts. Only donor users can complete donations.',
    'donation.type': 'Donation Type',
    'donation.one_time': 'One-Time',
    'donation.single': 'Single donation',
    'donation.monthly': 'Monthly',
    'donation.recurring': 'Recurring support',
    'donation.select_campaign': 'Select Campaign',
    'donation.no_campaigns': 'No campaigns are available yet. Your donation will be recorded as a general donation.',
    'donation.funded': 'funded',
    'donation.raised': 'raised',
    'donation.select_amount': 'Select Amount',
    'donation.custom_amount': 'Custom Amount',
    'donation.enter_custom_amount': 'Enter custom amount',
    'donation.payment_method': 'Payment Method',
    'donation.net_banking': 'Net Banking',
    'donation.net_banking_help': 'Razorpay checkout will open with net banking only',
    'donation.summary': 'Donation Summary',
    'donation.summary_subtitle': 'Ready to sync with Firebase',
    'donation.amount': 'Amount',
    'donation.type_label': 'Type',
    'donation.campaign': 'Campaign',
    'donation.payment': 'Payment',
    'donation.general': 'General Donation',
    'donation.impact_preview': 'Impact Preview',
    'donation.donor_required': 'Donor Account Required',
    'donation.opening_razorpay': 'Opening Razorpay...',
    'donation.pay_razorpay': 'Pay with Razorpay',
    'donation.thank_you': 'Thank You!',
    'donation.verified': 'Your Razorpay payment of ₹{amount} has been verified and recorded successfully.',
    'donation.impact_created': 'Impact Created',
    'donation.make_another': 'Make Another Donation',
    'donation.go_dashboard': 'Go to Dashboard',
  },
  hi: {
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.campaigns': 'अभियान',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.donate': 'दान करें',
    'hero.title': 'जीवन को सशक्त बनाना, आशा का निर्माण',
    'hero.subtitle': 'भारत भर में अनाथालयों और वृद्धाश्रमों का समर्थन',
    'hero.donate': 'अभी दान करें',
    'hero.volunteer': 'स्वयंसेवक बनें',
    'stats.donations': 'कुल दान',
    'stats.children': 'बच्चों की मदद की',
    'stats.volunteers': 'सक्रिय स्वयंसेवक',
    'stats.campaigns': 'सक्रिय अभियान',
    'dashboard': 'डैशबोर्ड',
    'impact': 'प्रभाव',
    'donate': 'दान करें',
    'donations': 'दान',
    'sponsorship': 'प्रायोजन',
    'wishlist': 'विशलिस्ट',
    'volunteers': 'स्वयंसेवक',
    'my tasks': 'मेरे कार्य',
    'achievements': 'उपलब्धियां',
    'needs': 'जरूरतें',
    'events': 'घटनाएं',
    'campaigns': 'अभियान',
    'reports': 'रिपोर्ट',
    'success stories': 'सफलता की कहानियां',
    'transparency': 'पारदर्शिता',
    'beneficiaries': 'लाभार्थी',
    'users': 'उपयोगकर्ता',
    'approvals': 'स्वीकृति',
    'settings': 'सेटिंग्स',
    'my support': 'मेरी सहायता',
    'requests': 'अनुरोध',
    'announcements': 'घोषणाएं',
    'admin': 'एडमिन पैनल',
    'navbar.search': 'अभियान, दाता, स्वयंसेवक खोजें...',
    'navbar.notifications': 'सूचनाएं',
    'navbar.no_notifications': 'अभी कोई सूचना नहीं है।',
    'navbar.just_now': 'अभी',
    'navbar.profile': 'प्रोफाइल',
    'navbar.logout': 'लॉगआउट',
    'chat.title': 'उमेद सहायक',
    'chat.status': 'ऑनलाइन • तुरंत जवाब देता है',
    'chat.quick_actions': 'त्वरित विकल्प:',
    'chat.placeholder': 'दान, सहायता, रिपोर्ट, अभियान के बारे में पूछें...',
    'chat.open_dashboard': 'डैशबोर्ड खोलें',
    'chat.get_support': 'सहायता लें',
    'chat.clear': 'चैट साफ करें',
    'chat.close': 'सहायक बंद करें',
    'support.need_help': 'मदद चाहिए?',
    'support.contact_team': 'हमारी सहायता टीम से संपर्क करें',
    'support.get_support': 'सहायता प्राप्त करें',
    'donation.title': 'दान करें',
    'donation.subtitle': 'आपका योगदान सीधे Firebase में सहेजा जाता है',
    'donation.view_only': 'यह पेज गैर-दाता खातों के लिए केवल देखने योग्य है। केवल दाता उपयोगकर्ता दान पूरा कर सकते हैं।',
    'donation.type': 'दान का प्रकार',
    'donation.one_time': 'एक बार',
    'donation.single': 'एकल दान',
    'donation.monthly': 'मासिक',
    'donation.recurring': 'आवर्ती सहायता',
    'donation.select_campaign': 'अभियान चुनें',
    'donation.no_campaigns': 'अभी कोई अभियान उपलब्ध नहीं है। आपका दान सामान्य दान के रूप में दर्ज किया जाएगा।',
    'donation.funded': 'वित्तपोषित',
    'donation.raised': 'एकत्रित',
    'donation.select_amount': 'राशि चुनें',
    'donation.custom_amount': 'कस्टम राशि',
    'donation.enter_custom_amount': 'कस्टम राशि दर्ज करें',
    'donation.payment_method': 'भुगतान विधि',
    'donation.net_banking': 'नेट बैंकिंग',
    'donation.net_banking_help': 'Razorpay चेकआउट केवल नेट बैंकिंग के साथ खुलेगा',
    'donation.summary': 'दान सारांश',
    'donation.summary_subtitle': 'Firebase के साथ सिंक के लिए तैयार',
    'donation.amount': 'राशि',
    'donation.type_label': 'प्रकार',
    'donation.campaign': 'अभियान',
    'donation.payment': 'भुगतान',
    'donation.general': 'सामान्य दान',
    'donation.impact_preview': 'प्रभाव पूर्वावलोकन',
    'donation.donor_required': 'दाता खाता आवश्यक',
    'donation.opening_razorpay': 'Razorpay खोला जा रहा है...',
    'donation.pay_razorpay': 'Razorpay से भुगतान करें',
    'donation.thank_you': 'धन्यवाद!',
    'donation.verified': '₹{amount} का आपका Razorpay भुगतान सत्यापित और सफलतापूर्वक रिकॉर्ड किया गया है।',
    'donation.impact_created': 'बना हुआ प्रभाव',
    'donation.make_another': 'एक और दान करें',
    'donation.go_dashboard': 'डैशबोर्ड पर जाएं',
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.about': 'आमच्याबद्दल',
    'nav.campaigns': 'मोहिमा',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.donate': 'दान करा',
    'hero.title': 'जीवन सशक्त करणे, आशा निर्माण करणे',
    'hero.subtitle': 'संपूर्ण भारतातील अनाथाश्रम आणि वृद्धाश्रमांना पाठिंबा',
    'hero.donate': 'आता दान करा',
    'hero.volunteer': 'स्वयंसेवक व्हा',
    'stats.donations': 'एकूण देणग्या',
    'stats.children': 'मुलांना मदत केली',
    'stats.volunteers': 'सक्रिय स्वयंसेवक',
    'stats.campaigns': 'सक्रिय मोहिमा',
    'dashboard': 'डॅशबोर्ड',
    'impact': 'प्रभाव',
    'donate': 'दान करा',
    'donations': 'देणग्या',
    'sponsorship': 'प्रायोजकत्व',
    'wishlist': 'विशलिस्ट',
    'volunteers': 'स्वयंसेवक',
    'my tasks': 'माझी कार्ये',
    'achievements': 'यश',
    'needs': 'गरजा',
    'events': 'कार्यक्रम',
    'campaigns': 'मोहिमा',
    'reports': 'अहवाल',
    'success stories': 'यशोगाथा',
    'transparency': 'पारदर्शकता',
    'beneficiaries': 'लाभार्थी',
    'users': 'वापरकर्ते',
    'approvals': 'मंजुरी',
    'settings': 'सेटिंग्ज',
    'my support': 'माझे समर्थन',
    'requests': 'विनंत्या',
    'announcements': 'घोषणा',
    'admin': 'प्रशासन पॅनेल',
    'navbar.search': 'मोहिमा, दाते, स्वयंसेवक शोधा...',
    'navbar.notifications': 'सूचना',
    'navbar.no_notifications': 'अजून कोणतीही सूचना नाही.',
    'navbar.just_now': 'आत्ताच',
    'navbar.profile': 'प्रोफाइल',
    'navbar.logout': 'लॉगआउट',
    'chat.title': 'उमेद सहाय्यक',
    'chat.status': 'ऑनलाइन • त्वरित प्रतिसाद',
    'chat.quick_actions': 'त्वरित पर्याय:',
    'chat.placeholder': 'देणगी, मदत, अहवाल, मोहिमा याबद्दल विचारा...',
    'chat.open_dashboard': 'डॅशबोर्ड उघडा',
    'chat.get_support': 'मदत घ्या',
    'chat.clear': 'चॅट साफ करा',
    'chat.close': 'सहाय्यक बंद करा',
    'support.need_help': 'मदत हवी आहे?',
    'support.contact_team': 'आमच्या सहाय्यक टीमशी संपर्क करा',
    'support.get_support': 'मदत मिळवा',
    'donation.title': 'देणगी द्या',
    'donation.subtitle': 'तुमचे योगदान थेट Firebase मध्ये जतन केले जाते',
    'donation.view_only': 'हे पान गैर-दाते खात्यांसाठी फक्त पाहण्यास उपलब्ध आहे. फक्त दाते वापरकर्ते देणगी पूर्ण करू शकतात.',
    'donation.type': 'देणगी प्रकार',
    'donation.one_time': 'एकदाची',
    'donation.single': 'एकच देणगी',
    'donation.monthly': 'मासिक',
    'donation.recurring': 'पुन्हा येणारे समर्थन',
    'donation.select_campaign': 'मोहीम निवडा',
    'donation.no_campaigns': 'अजून कोणत्याही मोहिमा उपलब्ध नाहीत. तुमची देणगी सामान्य देणगी म्हणून नोंदवली जाईल.',
    'donation.funded': 'पूर्ण',
    'donation.raised': 'जमा',
    'donation.select_amount': 'रक्कम निवडा',
    'donation.custom_amount': 'सानुकूल रक्कम',
    'donation.enter_custom_amount': 'सानुकूल रक्कम प्रविष्ट करा',
    'donation.payment_method': 'पेमेंट पद्धत',
    'donation.net_banking': 'नेट बँकिंग',
    'donation.net_banking_help': 'Razorpay चेकआउट फक्त नेट बँकिंगसह उघडेल',
    'donation.summary': 'देणगी सारांश',
    'donation.summary_subtitle': 'Firebase शी सिंक करण्यासाठी तयार',
    'donation.amount': 'रक्कम',
    'donation.type_label': 'प्रकार',
    'donation.campaign': 'मोहीम',
    'donation.payment': 'पेमेंट',
    'donation.general': 'सामान्य देणगी',
    'donation.impact_preview': 'परिणाम पूर्वावलोकन',
    'donation.donor_required': 'दाता खाते आवश्यक',
    'donation.opening_razorpay': 'Razorpay उघडत आहे...',
    'donation.pay_razorpay': 'Razorpay ने पैसे द्या',
    'donation.thank_you': 'धन्यवाद!',
    'donation.verified': '₹{amount} चे तुमचे Razorpay पेमेंट सत्यापित झाले आणि यशस्वीरीत्या नोंदवले गेले.',
    'donation.impact_created': 'निर्माण झालेला परिणाम',
    'donation.make_another': 'आणखी एक देणगी द्या',
    'donation.go_dashboard': 'डॅशबोर्डवर जा',
  },
};

const contentTranslations: Record<Exclude<Language, 'en'>, Record<string, string>> = {
  hi: {
    'Dashboard Overview': 'डैशबोर्ड अवलोकन',
    'Live admin summary from Firebase data.': 'Firebase डेटा से लाइव एडमिन सारांश।',
    'Last updated from live subscriptions': 'लाइव सब्सक्रिप्शन से अंतिम अपडेट',
    'Recent Donation Activity': 'हाल की दान गतिविधि',
    'No donations recorded yet.': 'अभी तक कोई दान दर्ज नहीं हुआ है।',
    'Platform Insights': 'प्लेटफ़ॉर्म अंतर्दृष्टि',
    'Open Events': 'कार्यक्रम खोलें',
    'My Assigned Events': 'मेरे सौंपे गए कार्यक्रम',
    'Browse Events': 'कार्यक्रम देखें',
    'No upcoming events scheduled yet.': 'अभी कोई आगामी कार्यक्रम निर्धारित नहीं है।',
    'My Tasks': 'मेरे कार्य',
    'No tasks assigned yet': 'अभी कोई कार्य सौंपा नहीं गया है',
    'Volunteer Dashboard': 'स्वयंसेवक डैशबोर्ड',
    'Staff Dashboard': 'स्टाफ डैशबोर्ड',
    'No urgent needs yet.': 'अभी कोई तत्काल आवश्यकता नहीं है।',
    'Needs Progress Overview': 'आवश्यकताओं की प्रगति अवलोकन',
    'No needs progress data yet.': 'अभी आवश्यकताओं की प्रगति का डेटा नहीं है।',
    'Recent Beneficiaries': 'हाल के लाभार्थी',
    'No beneficiaries added yet.': 'अभी कोई लाभार्थी जोड़ा नहीं गया है।',
    'No staff alerts yet.': 'अभी कोई स्टाफ अलर्ट नहीं है।',
    'Impact Dashboard': 'प्रभाव डैशबोर्ड',
    'Real-time view of where your donations make a difference': 'आपके दान कहाँ बदलाव ला रहे हैं, इसका रीयल-टाइम दृश्य',
    'Export Report': 'रिपोर्ट निर्यात करें',
    'This Month': 'इस माह',
    'Fund Distribution': 'निधि वितरण',
    'Monthly Impact Trends': 'मासिक प्रभाव रुझान',
    'Regional Impact': 'क्षेत्रीय प्रभाव',
    'Milestones': 'मील के पत्थर',
    'Impact Quality Assessment': 'प्रभाव गुणवत्ता आकलन',
    'No fund distribution data yet.': 'अभी निधि वितरण का डेटा नहीं है।',
    'No monthly impact data yet.': 'अभी मासिक प्रभाव का डेटा नहीं है।',
    'No regional data yet.': 'अभी क्षेत्रीय डेटा नहीं है।',
    'No milestones yet.': 'अभी कोई मील का पत्थर नहीं है।',
    'No quality data yet.': 'अभी गुणवत्ता डेटा नहीं है।',
    'Profile & Settings': 'प्रोफाइल और सेटिंग्स',
    'Manage your account, preferences, password, and live activity.': 'अपने खाते, प्राथमिकताओं, पासवर्ड और लाइव गतिविधि का प्रबंधन करें।',
    'Personal Information': 'व्यक्तिगत जानकारी',
    'Security Settings': 'सुरक्षा सेटिंग्स',
    'Wishlist & Needs': 'विशलिस्ट और आवश्यकताएं',
    'Browse live need items and sponsor exactly what is required.': 'लाइव आवश्यक वस्तुएं देखें और जो जरूरी है उसे ठीक उसी रूप में प्रायोजित करें।',
    'All Items': 'सभी आइटम',
    'Food & Nutrition': 'भोजन और पोषण',
    'How It Works': 'यह कैसे काम करता है',
    'Browse Items': 'आइटम देखें',
    'Choose Quantity': 'मात्रा चुनें',
    'Make Payment': 'भुगतान करें',
    'Track Impact': 'प्रभाव ट्रैक करें',
    'No wishlist items are available in this category yet.': 'इस श्रेणी में अभी कोई विशलिस्ट आइटम उपलब्ध नहीं है।',
    'Open need': 'खुली आवश्यकता',
    'Required by': 'आवश्यक तिथि',
    'Add 1 item(s)': '1 आइटम जोड़ें',
    'Checkout': 'चेकआउट',
    'Child Sponsorship': 'बाल प्रायोजन',
    'Make a lasting impact through monthly sponsorship': 'मासिक प्रायोजन के माध्यम से स्थायी प्रभाव डालें',
    'Available': 'उपलब्ध',
    'My Sponsorships': 'मेरे प्रायोजन',
    'Active Sponsorships': 'सक्रिय प्रायोजन',
    'Total Contributed': 'कुल योगदान',
    'Months Active': 'सक्रिय महीने',
    'Impact Score': 'प्रभाव स्कोर',
    'No sponsorship profiles available yet.': 'अभी कोई प्रायोजन प्रोफाइल उपलब्ध नहीं है।',
    'No active sponsorships yet.': 'अभी कोई सक्रिय प्रायोजन नहीं है।',
    'View Progress Report': 'प्रगति रिपोर्ट देखें',
    'Download Receipt': 'रसीद डाउनलोड करें',
    'Events': 'कार्यक्रम',
    'Join and manage community events': 'समुदाय कार्यक्रमों में शामिल हों और उन्हें प्रबंधित करें',
    'Create Event': 'कार्यक्रम बनाएं',
    'Create New Event': 'नया कार्यक्रम बनाएं',
    'All Events': 'सभी कार्यक्रम',
    'My Events': 'मेरे कार्यक्रम',
    'Total Events': 'कुल कार्यक्रम',
    'Upcoming Events': 'आगामी कार्यक्रम',
    'My Registrations': 'मेरे पंजीकरण',
    'No events available yet.': 'अभी कोई कार्यक्रम उपलब्ध नहीं है।',
    'Approvals & Requests': 'अनुमोदन और अनुरोध',
    'Review and approve pending requests': 'लंबित अनुरोधों की समीक्षा करें और अनुमोदित करें',
    'Pending': 'लंबित',
    'Approved': 'स्वीकृत',
    'Rejected': 'अस्वीकृत',
    'Campaign Management': 'अभियान प्रबंधन',
    'Create and manage fundraising campaigns': 'फंडरेज़िंग अभियानों को बनाएं और प्रबंधित करें',
    'Search campaigns by title or category...': 'शीर्षक या श्रेणी से अभियान खोजें...',
    'All Status': 'सभी स्थिति',
    'No active campaigns available yet.': 'अभी कोई सक्रिय अभियान उपलब्ध नहीं है।',
    'Financial Transparency': 'वित्तीय पारदर्शिता',
    'Quarterly Intake': 'त्रैमासिक प्राप्ति',
    'Platform Status': 'प्लेटफ़ॉर्म स्थिति',
    'Audit Snapshot': 'ऑडिट स्नैपशॉट',
    'No donation categories available yet.': 'अभी कोई दान श्रेणियां उपलब्ध नहीं हैं।',
    'No donation history available for quarterly breakdown yet.': 'त्रैमासिक विभाजन के लिए अभी दान इतिहास उपलब्ध नहीं है।',
    'Beneficiary Management': 'लाभार्थी प्रबंधन',
    'Add New Beneficiary': 'नया लाभार्थी जोड़ें',
    'My Achievements': 'मेरी उपलब्धियां',
    'Recent Achievements': 'हाल की उपलब्धियां',
    'No achievements yet': 'अभी कोई उपलब्धि नहीं है',
    'Progress Summary': 'प्रगति सारांश',
    'Task Management': 'कार्य प्रबंधन',
    'No support requests yet': 'अभी कोई सहायता अनुरोध नहीं है',
    'My Support Requests': 'मेरे सहायता अनुरोध',
    'Reports & Receipts': 'रिपोर्ट और रसीदें',
    'Download donation receipts and tax reports': 'दान रसीदें और कर रिपोर्ट डाउनलोड करें',
    'Receipts': 'रसीदें',
    'Tax Reports': 'कर रिपोर्ट',
    'Search by transaction ID or campaign...': 'लेनदेन आईडी या अभियान से खोजें...',
    'Download 80G Certificate': '80G प्रमाणपत्र डाउनलोड करें',
    'Filter': 'फ़िल्टर',
    'Contact support': 'सहायता से संपर्क करें',
    'Open dashboard': 'डैशबोर्ड खोलें',
    'Share support issue': 'सहायता समस्या साझा करें',
    'English': 'अंग्रेज़ी',
  },
  mr: {
    'Dashboard Overview': 'डॅशबोर्ड आढावा',
    'Live admin summary from Firebase data.': 'Firebase डेटामधून थेट प्रशासकीय सारांश.',
    'Last updated from live subscriptions': 'लाइव्ह सदस्यत्वांमधून शेवटचे अद्यतन',
    'Recent Donation Activity': 'अलीकडील देणगी क्रियाकलाप',
    'No donations recorded yet.': 'अजून कोणतीही देणगी नोंदवलेली नाही.',
    'Platform Insights': 'प्लॅटफॉर्म अंतर्दृष्टी',
    'Open Events': 'कार्यक्रम उघडा',
    'My Assigned Events': 'माझे नेमलेले कार्यक्रम',
    'Browse Events': 'कार्यक्रम पाहा',
    'No upcoming events scheduled yet.': 'अजून कोणतेही आगामी कार्यक्रम नियोजित नाहीत.',
    'My Tasks': 'माझी कार्ये',
    'No tasks assigned yet': 'अजून कोणतीही कार्ये दिलेली नाहीत',
    'Volunteer Dashboard': 'स्वयंसेवक डॅशबोर्ड',
    'Staff Dashboard': 'कर्मचारी डॅशबोर्ड',
    'No urgent needs yet.': 'अजून तातडीच्या गरजा नाहीत.',
    'Needs Progress Overview': 'गरज प्रगती आढावा',
    'No needs progress data yet.': 'अजून गरज प्रगती डेटा नाही.',
    'Recent Beneficiaries': 'अलीकडील लाभार्थी',
    'No beneficiaries added yet.': 'अजून लाभार्थी जोडलेले नाहीत.',
    'No staff alerts yet.': 'अजून कर्मचारी सूचना नाहीत.',
    'Impact Dashboard': 'प्रभाव डॅशबोर्ड',
    'Real-time view of where your donations make a difference': 'तुमच्या देणग्यांनी कुठे बदल घडवला याचे रिअल-टाइम दृश्य',
    'Export Report': 'अहवाल निर्यात करा',
    'This Month': 'या महिन्यात',
    'Fund Distribution': 'निधी वितरण',
    'Monthly Impact Trends': 'मासिक प्रभाव प्रवाह',
    'Regional Impact': 'प्रादेशिक प्रभाव',
    'Milestones': 'टप्पे',
    'Impact Quality Assessment': 'प्रभाव गुणवत्ता मूल्यमापन',
    'No fund distribution data yet.': 'अजून निधी वितरण डेटा नाही.',
    'No monthly impact data yet.': 'अजून मासिक प्रभाव डेटा नाही.',
    'No regional data yet.': 'अजून प्रादेशिक डेटा नाही.',
    'No milestones yet.': 'अजून कोणतेही टप्पे नाहीत.',
    'No quality data yet.': 'अजून गुणवत्ता डेटा नाही.',
    'Profile & Settings': 'प्रोफाइल आणि सेटिंग्ज',
    'Manage your account, preferences, password, and live activity.': 'तुमचे खाते, पसंती, पासवर्ड आणि थेट क्रियाकलाप व्यवस्थापित करा.',
    'Personal Information': 'वैयक्तिक माहिती',
    'Security Settings': 'सुरक्षा सेटिंग्ज',
    'Wishlist & Needs': 'विशलिस्ट आणि गरजा',
    'Browse live need items and sponsor exactly what is required.': 'लाइव्ह गरजेच्या वस्तू पाहा आणि नेमकी जे आवश्यक आहे त्याला प्रायोजित करा.',
    'All Items': 'सर्व वस्तू',
    'Food & Nutrition': 'अन्न व पोषण',
    'How It Works': 'हे कसे कार्य करते',
    'Browse Items': 'वस्तू पाहा',
    'Choose Quantity': 'प्रमाण निवडा',
    'Make Payment': 'पेमेंट करा',
    'Track Impact': 'प्रभाव पहा',
    'No wishlist items are available in this category yet.': 'या श्रेणीत अजून कोणत्याही विशलिस्ट वस्तू उपलब्ध नाहीत.',
    'Open need': 'खुली गरज',
    'Required by': 'आवश्यक तारीख',
    'Add 1 item(s)': '1 वस्तू जोडा',
    'Checkout': 'चेकआउट',
    'Child Sponsorship': 'बाल प्रायोजकत्व',
    'Make a lasting impact through monthly sponsorship': 'मासिक प्रायोजकत्वाद्वारे दीर्घकालीन प्रभाव निर्माण करा',
    'Available': 'उपलब्ध',
    'My Sponsorships': 'माझे प्रायोजकत्व',
    'Active Sponsorships': 'सक्रिय प्रायोजकत्व',
    'Total Contributed': 'एकूण योगदान',
    'Months Active': 'सक्रिय महिने',
    'Impact Score': 'प्रभाव गुण',
    'No sponsorship profiles available yet.': 'अजून कोणतीही प्रायोजकत्व प्रोफाइल उपलब्ध नाहीत.',
    'No active sponsorships yet.': 'अजून कोणतेही सक्रिय प्रायोजकत्व नाही.',
    'View Progress Report': 'प्रगती अहवाल पहा',
    'Download Receipt': 'पावती डाउनलोड करा',
    'Events': 'कार्यक्रम',
    'Join and manage community events': 'समुदाय कार्यक्रमांमध्ये सामील व्हा आणि व्यवस्थापित करा',
    'Create Event': 'कार्यक्रम तयार करा',
    'Create New Event': 'नवीन कार्यक्रम तयार करा',
    'All Events': 'सर्व कार्यक्रम',
    'My Events': 'माझे कार्यक्रम',
    'Total Events': 'एकूण कार्यक्रम',
    'Upcoming Events': 'आगामी कार्यक्रम',
    'My Registrations': 'माझी नोंदणी',
    'No events available yet.': 'अजून कोणतेही कार्यक्रम उपलब्ध नाहीत.',
    'Approvals & Requests': 'मंजुरी आणि विनंत्या',
    'Review and approve pending requests': 'प्रलंबित विनंत्यांचे पुनरावलोकन करा आणि मंजूर करा',
    'Pending': 'प्रलंबित',
    'Approved': 'मंजूर',
    'Rejected': 'नाकारले',
    'Campaign Management': 'मोहीम व्यवस्थापन',
    'Create and manage fundraising campaigns': 'निधी संकलन मोहिमा तयार करा आणि व्यवस्थापित करा',
    'Search campaigns by title or category...': 'शीर्षक किंवा श्रेणीनुसार मोहिमा शोधा...',
    'All Status': 'सर्व स्थिती',
    'No active campaigns available yet.': 'अजून कोणत्याही सक्रिय मोहिमा उपलब्ध नाहीत.',
    'Financial Transparency': 'आर्थिक पारदर्शकता',
    'Quarterly Intake': 'तिमाही प्राप्ती',
    'Platform Status': 'प्लॅटफॉर्म स्थिती',
    'Audit Snapshot': 'ऑडिट स्नॅपशॉट',
    'No donation categories available yet.': 'अजून कोणत्याही देणगी श्रेणी उपलब्ध नाहीत.',
    'No donation history available for quarterly breakdown yet.': 'तिमाही तपशीलासाठी अजून देणगी इतिहास उपलब्ध नाही.',
    'Beneficiary Management': 'लाभार्थी व्यवस्थापन',
    'Add New Beneficiary': 'नवीन लाभार्थी जोडा',
    'My Achievements': 'माझी यशे',
    'Recent Achievements': 'अलीकडील यशे',
    'No achievements yet': 'अजून कोणतीही यशे नाहीत',
    'Progress Summary': 'प्रगती सारांश',
    'Task Management': 'कार्य व्यवस्थापन',
    'No support requests yet': 'अजून कोणत्याही मदत विनंत्या नाहीत',
    'My Support Requests': 'माझ्या मदत विनंत्या',
    'Reports & Receipts': 'अहवाल आणि पावत्या',
    'Download donation receipts and tax reports': 'देणगी पावत्या आणि कर अहवाल डाउनलोड करा',
    'Receipts': 'पावत्या',
    'Tax Reports': 'कर अहवाल',
    'Search by transaction ID or campaign...': 'व्यवहार आयडी किंवा मोहिमेनुसार शोधा...',
    'Download 80G Certificate': '80G प्रमाणपत्र डाउनलोड करा',
    'Filter': 'फिल्टर',
    'Contact support': 'मदतीशी संपर्क साधा',
    'Open dashboard': 'डॅशबोर्ड उघडा',
    'Share support issue': 'मदतीची समस्या शेअर करा',
    'English': 'इंग्रजी',
  },
};

const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

function translateStaticContent(root: ParentNode, language: Language) {
  const activeMap = language === 'en' ? undefined : contentTranslations[language];

  if (!activeMap) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentTag = node.parentElement?.tagName;
      if (parentTag && EXCLUDED_TAGS.has(parentTag)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((node) => {
    const current = node.textContent ?? '';
    const original = textNodeOriginals.get(node) ?? current;
    const trimmed = original.trim();
    if (!trimmed) {
      return;
    }

    const translated = activeMap[trimmed];

    if (!translated) {
      // Keep dynamic or data-driven text under React's control instead of
      // forcing an older cached value back into the DOM.
      textNodeOriginals.set(node, current);
      return;
    }

    if (!textNodeOriginals.has(node)) {
      textNodeOriginals.set(node, original);
    }

    node.textContent = original.replace(trimmed, translated);
  });

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    const stored = elementAttributeOriginals.get(element) || {};

    (['placeholder', 'title', 'aria-label'] as const).forEach((attr) => {
      const current = element.getAttribute(attr);
      if (!current) {
        return;
      }

      if (!stored[attr]) {
        stored[attr] = current;
      }

      const translated = activeMap?.[stored[attr]!];
      element.setAttribute(attr, translated || stored[attr]!);
    });

    elementAttributeOriginals.set(element, stored);
  });
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }

    return (localStorage.getItem('umedh-language') as Language) || 'en';
  });

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    localStorage.setItem('umedh-language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let frame = 0;
    const applyTranslations = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => translateStaticContent(document.body, language));
    };

    applyTranslations();

    const observer = new MutationObserver(() => {
      applyTranslations();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <React.Fragment key={language}>{children}</React.Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

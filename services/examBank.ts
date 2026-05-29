import { ProficiencyLevel } from '../types';

export interface ExamQuestion {
  question: string;
  questionTranslation: string;
  options: string[];
  correctAnswer: string;
}

export interface ExamContent {
  text?: string;
  textTranslation?: string;
  questions?: ExamQuestion[];
  writingPrompt?: string;
  writingPromptTranslation?: string;
  speakingPoints?: string[];
  speakingPointsTranslation?: string[];
}

export const OFFLINE_EXAM_BANK: Record<ProficiencyLevel, Record<string, ExamContent[]>> = {
  [ProficiencyLevel.A1]: {
    Reading: [
      {
        text: "Hallo Sarah,\nam Samstag habe ich Geburtstag und feiere eine kleine Party. Wir fangen um 18:00 Uhr an. Kannst du kommen und einen Salat mitbringen? Bitte gib mir bis Donnerstag Bescheid. Liebe Grüße, Max.",
        textTranslation: "Hello Sarah,\nOn Saturday it is my birthday and I am throwing a small party. We start at 6:00 PM. Can you come and bring a salad? Please let me know by Thursday. Warm regards, Max.",
        questions: [
          {
            question: "Wann feiert Max Geburtstag?",
            questionTranslation: "When does Max celebrate his birthday?",
            options: ["Am Donnerstag", "Am Samstag", "Am Freitag"],
            correctAnswer: "Am Samstag"
          },
          {
            question: "Um wie viel Uhr beginnt die Party?",
            questionTranslation: "What time does the party begin?",
            options: ["Um 16:00 Uhr", "Um 18:00 Uhr", "Um 20:00 Uhr"],
            correctAnswer: "Um 18:00 Uhr"
          },
          {
            question: "Was soll Sarah zur Party mitbringen?",
            questionTranslation: "What should Sarah bring to the party?",
            options: ["Einen Kuchen", "Einen Salat", "Säfte"],
            correctAnswer: "Einen Salat"
          },
          {
            question: "Bis wann muss Sarah Bescheid geben?",
            questionTranslation: "By when does Sarah need to let him know?",
            options: ["Bis Donnerstag", "Bis Samstag", "Bis heute"],
            correctAnswer: "Bis Donnerstag"
          },
          {
            question: "Wer feiert den Geburtstag?",
            questionTranslation: "Who is celebrating their birthday?",
            options: ["Sarah", "Max", "Niemand"],
            correctAnswer: "Max"
          }
        ]
      },
      {
        text: "Sehr geehrte Damen und Herren,\nder Deutschkurs A1 in Raum 104 beginnt heute nicht um 9:00 Uhr, sondern um 10:30 Uhr wegen einer Lehrerbesprechung. Morgen findet der Kurs wieder zur gewohnten Zeit statt. Vielen Dank für Ihr Verständnis. Ihre Sprachschule.",
        textTranslation: "Dear Sir or Madam,\nThe German course A1 in room 104 does not begin at 9:00 AM today, but at 10:30 AM due to a teacher meeting. Tomorrow the course will take place again at the usual time. Thank you for your understanding. Your Language School.",
        questions: [
          {
            question: "In welchem Raum ist der Deutschkurs?",
            questionTranslation: "In which room is the German course?",
            options: ["Raum 100", "Raum 104", "Raum 204"],
            correctAnswer: "Raum 104"
          },
          {
            question: "Wann beginnt der Kurs HEUTE?",
            questionTranslation: "When does the course begin TODAY?",
            options: ["Um 9:00 Uhr", "Um 10:30 Uhr", "Um 11:30 Uhr"],
            correctAnswer: "Um 10:30 Uhr"
          },
          {
            question: "Warum gibt es eine Verspätung?",
            questionTranslation: "Why is there a delay?",
            options: ["Wegen einer Lehrerbesprechung", "Wegen des Wetters", "Wegen eines Feiertags"],
            correctAnswer: "Wegen einer Lehrerbesprechung"
          },
          {
            question: "Wann findet der Kurs morgen statt?",
            questionTranslation: "When does the course take place tomorrow?",
            options: ["Zur gewohnten Zeit", "Wieder verspätet", "Gar nicht"],
            correctAnswer: "Zur gewohnten Zeit"
          },
          {
            question: "Wer schreibt diese Mitteilung?",
            questionTranslation: "Who is writing this notice?",
            options: ["Ein Schüler", "Die Sprachschule", "Ein Busfahrer"],
            correctAnswer: "Die Sprachschule"
          }
        ]
      }
    ],
    Listening: [
      {
        text: "Sehr geehrte Fahrgäste, wegen Bauarbeiten auf der Strecke fährt der Zug ICE 511 nach Frankfurt heute ausnahmsweise von Gleis 5 ab. Bitte steigen Sie nicht auf Gleis 12 ein. Ich wiederhole: ICE 511 nach Frankfurt fährt ab Gleis 5.",
        textTranslation: "Dear passengers, due to construction work on the line, train ICE 511 to Frankfurt will exceptionally depart from platform 5 today. Please do not board on platform 12. I repeat: ICE 511 to Frankfurt departs from platform 5.",
        questions: [
          {
            question: "Wohin fährt der Zug ICE 511?",
            questionTranslation: "Where is the train ICE 511 going?",
            options: ["Nach Berlin", "Nach Frankfurt", "Nach München"],
            correctAnswer: "Nach Frankfurt"
          },
          {
            question: "Von welchem Gleis fährt der Zug heute ab?",
            questionTranslation: "From which platform is the train departing today?",
            options: ["Von Gleis 12", "Von Gleis 5", "Von Gleis 1"],
            correctAnswer: "Von Gleis 5"
          },
          {
            question: "Warum ändert sich das Abfahrtsgleis?",
            questionTranslation: "Why does the departure platform change?",
            options: ["Wegen Bauarbeiten", "Wegen eines Streiks", "Wegen schlechten Wetters"],
            correctAnswer: "Wegen Bauarbeiten"
          },
          {
            question: "Welcher Zug ist betroffen?",
            questionTranslation: "Which train is affected?",
            options: ["ICE 12", "ICE 511", "ICE 5"],
            correctAnswer: "ICE 511"
          },
          {
            question: "Was sollen Fahrgäste auf Gleis 12 tun?",
            questionTranslation: "What should passengers on platform 12 do?",
            options: ["Nicht einsteigen und zu Gleis 5 gehen", "Einfach warten", "Eine Fahrkarte kaufen"],
            correctAnswer: "Nicht einsteigen und zu Gleis 5 gehen"
          }
        ]
      },
      {
        text: "Hallo Lisa, hier ist Ben. Ich bin im Supermarkt. Möchtest du heute Abend Tomatensuppe oder Nudeln essen? Wenn du Suppe willst, bringe ich noch Brot und Käse mit. Bitte ruf mich schnell zurück, danke!",
        textTranslation: "Hello Lisa, this is Ben. I'm in the supermarket. Would you like to eat tomato soup or pasta tonight? If you want soup, I will also bring bread and cheese. Please call me back quickly, thanks!",
        questions: [
          {
            question: "Wo ist Ben?",
            questionTranslation: "Where is Ben?",
            options: ["Zu Hause", "Im Supermarkt", "In der Schule"],
            correctAnswer: "Im Supermarkt"
          },
          {
            question: "Welche beiden Speisen schlägt Ben vor?",
            questionTranslation: "Which two dishes does Ben suggest?",
            options: ["Fisch oder Suppe", "Tomatensuppe oder Nudeln", "Pizza oder Salat"],
            correctAnswer: "Tomatensuppe oder Nudeln"
          },
          {
            question: "Was bringt Ben mit, falls Lisa Suppe möchte?",
            questionTranslation: "What will Ben bring if Lisa wants soup?",
            options: ["Brot und Käse", "Bier und Wein", "Obst und Gemüse"],
            correctAnswer: "Brot und Käse"
          },
          {
            question: "Wer ruft Lisa an?",
            questionTranslation: "Who is calling Lisa?",
            options: ["Ihr Lehrer", "Ben", "Ihre Mutter"],
            correctAnswer: "Ben"
          },
          {
            question: "Was soll Lisa tun?",
            questionTranslation: "What should Lisa do?",
            options: ["Schnell zurückrufen", "Suppe kochen", "Im Supermarkt bleiben"],
            correctAnswer: "Schnell zurückrufen"
          }
        ]
      }
    ],
    Writing: [
      {
        writingPrompt: "Sie möchten am kommenden Freitag Ihren Geburtstag feiern. Schreiben Sie eine E-Mail an Ihren Freund Thomas:\n- Warum schreiben Sie?\n- Wann beginnt die Feier und wo?\n- Bringt er etwas mit (z.B. Getränke)?\n(Schreiben Sie 30–40 Wörter)",
        writingPromptTranslation: "You would like to celebrate your birthday next Friday. Write an email to your friend Thomas:\n- Why are you writing?\n- When and where does the celebration start?\n- Is he bringing something (e.g., drinks)?\n(Write 30-40 words)"
      },
      {
        writingPrompt: "Ihr Notebook ist kaputt und Sie brauchen Hilfe. Schreiben Sie an Ihren Kollegen Alex:\n- Was ist das Problem?\n- Wann haben Sie Zeit für ein Treffen?\n- Wo treffen Sie sich?\n(Schreiben Sie 30–40 Wörter)",
        writingPromptTranslation: "Your notebook is broken and you need help. Write to your colleague Alex:\n- What is the problem?\n- When do you have time to meet?\n- Where do you meet?\n(Write 30-40 words)"
      }
    ],
    Speaking: [
      {
        speakingPoints: [
          "Sich vorstellen: Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobbys.",
          "Fragen stellen & beantworten zum Thema 'Essen und Trinken' (z.B. Was trinken Sie morgens?).",
          "Bitten formulieren und darauf reagieren (z.B. 'Geben Sie mir bitte das Wasser!')."
        ],
        speakingPointsTranslation: [
          "Introduce yourself: Name, age, country, place of residence, languages, profession, hobbies.",
          "Ask & answer questions about 'Food and Drink' (e.g., What do you drink in the morning?).",
          "Formulate requests and respond to them (e.g., 'Please give me the water!')."
        ]
      },
      {
        speakingPoints: [
          "Sich vorstellen: Name, Familie, Alltag, Lieblingsfach/-beschäftigung.",
          "Fragen stellen & beantworten zum Thema 'Freizeit & Einkaufen' (z.B. Wohin gehen Sie am Wochenende?).",
          "Alltagshilfen verlangen oder anbieten (z.B. 'Kannst du mir bitte helfen, die Tasche zu tragen?')."
        ],
        speakingPointsTranslation: [
          "Introduce yourself: Name, family, daily routine, favorite subject/occupation.",
          "Ask & answer questions about 'Leisure & Shopping' (e.g., Where do you go on weekends?).",
          "Request or offer daily help (e.g., 'Can you please help me carry the bag?')."
        ]
      }
    ]
  },
  [ProficiencyLevel.A2]: {
    Reading: [
      {
        text: "Liebe Kolleginnen und Kollegen,\nwie Sie wissen, ziehen wir nächsten Monat in unser neues Bürogebäude im Stadtzentrum um. Das bedeutet, dass alle Mitarbeiter ihre Kisten bis zum 15. Juni gepackt haben müssen. Die IT-Abteilung wird am Wochenende (18./19. Juni) alle Computer abbauen und am neuen Standort wieder aufbauen. Ab Montag, dem 20. Juni, arbeiten wir dann alle am neuen Platz. Bei Fragen steht Ihnen das Umzugsteam jederzeit zur Verfügung.\nMit freundlichen Grüßen,\nDie Geschäftsleitung",
        textTranslation: "Dear Colleagues,\nAs you know, next month we are moving into our new office building in the city center. This means that all employees must have their boxes packed by June 15th. The IT department will dismantle all computers over the weekend (June 18th/19th) and set them up again at the new location. Starting Monday, June 20th, we will all work at the new place. If you have any questions, the moving team is at your disposal at any time.\nWith best regards,\nThe Management",
        questions: [
          {
            question: "Wohin zieht die Firma nächsten Monat um?",
            questionTranslation: "Where is the company moving next month?",
            options: ["In ein anderes Land", "In ein neues Bürogebäude im Stadtzentrum", "Ins Homeoffice"],
            correctAnswer: "In ein neues Bürogebäude im Stadtzentrum"
          },
          {
            question: "Bis wann müssen die Mitarbeiter ihre Kisten gepackt haben?",
            questionTranslation: "By when must employees have their boxes packed?",
            options: ["Bis zum 12. Juni", "Bis zum 15. Juni", "Bis zum 20. Juni"],
            correctAnswer: "Bis zum 15. Juni"
          },
          {
            question: "Was macht die IT-Abteilung am Wochenende (18./19. Juni)?",
            questionTranslation: "What is the IT department doing over the weekend (June 18/19)?",
            options: ["Sie hat Urlaub", "Sie baut die Computer ab und im neuen Büro wieder auf", "Sie führt Gespräche"],
            correctAnswer: "Sie baut die Computer ab und im neuen Büro wieder auf"
          },
          {
            question: "Ab wann arbeitet die Belegschaft offiziell am neuen Standort?",
            questionTranslation: "From when does the workforce officially work at the new location?",
            options: ["Ab dem 15. Juni", "Ab Montag, dem 20. Juni", "Ab nächstem Jahr"],
            correctAnswer: "Ab Montag, dem 20. Juni"
          },
          {
            question: "Wer beantwortet Fragen zum Umzug?",
            questionTranslation: "Who answers questions about the move?",
            options: ["Das Umzugsteam", "Nur die IT-Abteilung", "Die Kunden"],
            correctAnswer: "Das Umzugsteam"
          }
        ]
      },
      {
        text: "Wetterbericht für Deutschland:\nAm morgigen Freitag erwartet uns im Norden und Westen dichter Regen und starker Wind bei maximal 15 Grad. Im Süden und Osten dagegen bleibt es den ganzen Tag freundlich und trocken mit viel Sonnenschein und Temperaturen bis zu 22 Grad. Erst am Sonntag zieht auch im Süden kühlere Luft auf und bringt Gewitter mit sich. Vergessen Sie im Nordwesten also Ihren Regenschirm nicht!",
        textTranslation: "Weather report for Germany:\nTomorrow, Friday, we expect heavy rain and strong wind in the north and west with a maximum of 15 degrees. In the south and east, on the other hand, it remains pleasant and dry all day with lots of sunshine and temperatures up to 22 degrees. Only on Sunday will cooler air move into the south as well, bringing thunderstorms with it. So don't forget your umbrella in the northwest!",
        questions: [
          {
            question: "Wie wird das Wetter morgen im Norden und Westen?",
            questionTranslation: "How will the weather be tomorrow in the north and west?",
            options: ["Sehr heiß und trocken", "Dichter Regen und starker Wind", "Viel Sonnenschein"],
            correctAnswer: "Dichter Regen und starker Wind"
          },
          {
            question: "Welche Temperaturen werden im Süden erreicht?",
            questionTranslation: "Which temperatures will be reached in the south?",
            options: ["Bis zu 15 Grad", "Bis zu 22 Grad", "Über 30 Grad"],
            correctAnswer: "Bis zu 22 Grad"
          },
          {
            question: "Wann ändert sich das Wetter im Süden?",
            questionTranslation: "When does the weather change in the south?",
            options: ["Am Freitag", "Am Samstag", "Am Sonntag"],
            correctAnswer: "Am Sonntag"
          },
          {
            question: "Was droht am Sonntag im Süden?",
            questionTranslation: "What is threatening on Sunday in the south?",
            options: ["Gewitter", "Schnee und Glatteis", "Gar nichts"],
            correctAnswer: "Gewitter"
          },
          {
            question: "Welcher Tipp wird den Menschen im Nordwesten gegeben?",
            questionTranslation: "What tip is given to people in the northwest?",
            options: ["Zu Hause zu bleiben", "Den Regenschirm nicht zu vergessen", "Sonnencreme zu kaufen"],
            correctAnswer: "Den Regenschirm nicht zu vergessen"
          }
        ]
      }
    ],
    Listening: [
      {
        text: "Achtung an alle Fahrgäste: Wegen einer Signalstörung hat die S-Bahn-Linie S1 Richtung Hauptbahnhof aktuell circa 20 Minuten Verspätung. Für Fahrgäste mit dem Ziel Flughafen empfehlen wir, ersatzweise die Busse der Linie 82 oder die S-Bahn S8 zu nutzen. Wir bitten um Entschuldigung für diese Unannehmlichkeit.",
        textTranslation: "Attention all passengers: Due to a signal malfunction, S-Bahn line S1 towards the main station currently has a delay of about 20 minutes. For passengers traveling to the airport, we recommend using bus line 82 or S-Bahn S8 instead. We apologize for this inconvenience.",
        questions: [
          {
            question: "Welche S-Bahn-Linie hat Verspätung?",
            questionTranslation: "Which S-Bahn line is delayed?",
            options: ["Die S8", "Die S1", "Die Buslinie 82"],
            correctAnswer: "Die S1"
          },
          {
            question: "Was ist der Grund für die Verspätung?",
            questionTranslation: "What is the reason for the delay?",
            options: ["Eine Signalstörung", "Ein Unfall", "Schlechtes Wetter"],
            correctAnswer: "Eine Signalstörung"
          },
          {
            question: "Wie lang ist die voraussichtliche Verspätung?",
            questionTranslation: "How long is the expected delay?",
            options: ["Circa 5 Minuten", "Circa 20 Minuten", "Zwei Stunden"],
            correctAnswer: "Circa 20 Minuten"
          },
          {
            question: "Welche Ausweichmöglichkeit haben Fluggäste?",
            questionTranslation: "What alternative do airport passengers have?",
            options: ["Zu Fuß gehen", "Bus 82 oder S-Bahn S8 benutzen", "Auf die S1 warten"],
            correctAnswer: "Bus 82 oder S-Bahn S8 benutzen"
          },
          {
            question: "Wohin fährt die verspätete S1?",
            questionTranslation: "Where is the delayed S1 heading?",
            options: ["Richtung Hauptbahnhof", "Richtung Flughafen", "In die Werkstatt"],
            correctAnswer: "Richtung Hauptbahnhof"
          }
        ]
      },
      {
        text: "Guten Tag, hier spricht Arztpraxis Dr. Weber. Frau Becker, wir müssen Ihren Untersuchungstermin für morgen früh leider absagen, da Herr Dr. Weber krank geworden ist. Könnten Sie stattdessen am Donnerstag um 15:45 Uhr kommen? Bitte rufen Sie uns heute bis 18 Uhr zurück, um den neuen Termin zu bestätigen.",
        textTranslation: "Good afternoon, this is Dr. Weber's clinic. Mrs. Becker, we are unfortunately forced to cancel your examination appointment for tomorrow morning, as Dr. Weber has fallen ill. Could you come on Thursday at 3:45 PM instead? Please call us back today by 6 PM to confirm the new appointment.",
        questions: [
          {
            question: "Wer ruft Frau Becker an?",
            questionTranslation: "Who is calling Mrs. Becker?",
            options: ["Ein Apotheker", "Die Arztpraxis Dr. Weber", "Ein Krankenhaus"],
            correctAnswer: "Die Arztpraxis Dr. Weber"
          },
          {
            question: "Warum wird der Termin abgesagt?",
            questionTranslation: "Why is the appointment cancelled?",
            options: ["Weil die Praxis umzieht", "Weil Herr Dr. Weber krank ist", "Weil Frau Becker keine Zeit hat"],
            correctAnswer: "Weil Herr Dr. Weber krank ist"
          },
          {
            question: "Wann soll der neue Ausweichtermin stattfinden?",
            questionTranslation: "When should the alternative appointment take place?",
            options: ["Am Donnerstag um 15:45 Uhr", "Morgen früh um 9:00 Uhr", "Nächsten Monat"],
            correctAnswer: "Am Donnerstag um 15:45 Uhr"
          },
          {
            question: "Bis wann soll sich Frau Becker zurückmelden?",
            questionTranslation: "By when should Mrs. Becker report back?",
            options: ["Morgen Mittag", "Heute bis 18 Uhr", "Am Donnerstag"],
            correctAnswer: "Heute bis 18 Uhr"
          },
          {
            question: "Für welchen Zweck ist der Termin?",
            questionTranslation: "What is the purpose of the appointment?",
            options: ["Zur Untersuchung", "Für ein Vorstellungsgespräch", "Für eine Renovierung"],
            correctAnswer: "Zur Untersuchung"
          }
        ]
      }
    ],
    Writing: [
      {
        writingPrompt: "Ihre Nachbarin, Frau Müller, hat Sie zu einem Kaffee eingeladen, um Ihren Einzug zu feiern. Da Sie am vereinbarten Tag arbeiten müssen, können Sie nicht kommen. Schreiben Sie eine formelle Mitteilung:\n- Bedanken Sie sich für die nette Einladung.\n- Erklären Sie, warum Sie absagen müssen (z.B. dringende Arbeit).\n- Schlagen Sie einen neuen Termin vor (z.B. am kommenden Wochenende).\n(Schreiben Sie 50–60 Wörter)",
        writingPromptTranslation: "Your neighbor, Mrs. Müller, has invited you for coffee to celebrate your move. Since you have to work on the agreed day, you cannot come. Write a formal note:\n- Thank her for the kind invitation.\n- Explain why you have to cancel (e.g., urgent work).\n- Propose a new date (e.g., next weekend).\n(Write 50-60 words)"
      },
      {
        writingPrompt: "Sie haben einen Artikel im Internet gekauft, aber das Produkt ist beschädigt (kaputt). Schreiben Sie eine E-Mail an den Kundenservice:\n- Was haben Sie wann gekauft?\n- Was genau ist an dem Produkt kaputt?\n- Möchten Sie Ihr Geld zurück oder ein neues Produkt?\n(Schreiben Sie 50–60 Wörter)",
        writingPromptTranslation: "You bought an item on the internet, but the product is damaged (broken). Write an email to customer service:\n- What did you buy and when?\n- What exactly is broken on the product?\n- Do you want your money back or a new product?\n(Write 50-60 words)"
      }
    ],
    Speaking: [
      {
        speakingPoints: [
          "Sich vorstellen und Rückfragen beantworten (z.B. Was machen Sie in Ihrer Freizeit für Ihre Fitness?).",
          "Ein gemeinsames Gespräch führen: Planen Sie zusammen mit dem Partner eine Überraschungsparty für einen Kollegen.",
          "Ein Bild beschreiben oder über ein Alltagsthema sprechen (z.B. 'Mein letzter Urlaub' oder 'Einkaufen im Supermarkt vs. Wochenmarkt')."
        ],
        speakingPointsTranslation: [
          "Introduce yourself and answer follow-up questions (e.g., What do you do in your free time for your fitness?).",
          "Conduct a joint conversation: Plan a surprise party for a colleague together with your partner.",
          "Describe a picture or talk about a daily topic (e.g., 'My last vacation' or 'Shopping in a supermarket vs. weekly market')."
        ]
      },
      {
        speakingPoints: [
          "Sich vorstellen, über Ihre Wohnerfahrung berichten und auf Nachfragen reagieren.",
          "Gemeinsam ein Wochenende planen: Aktivitäten, Transport, Kosten.",
          "Über das Thema 'Mobilität und Verkehrsmittel' sprechen (Vor- und Nachteile von Fahrrad, Auto, Bahn)."
        ],
        speakingPointsTranslation: [
          "Introduce yourself, report on your living experience, and respond to inquiries.",
          "Plan a weekend together: activities, transport, costs.",
          "Talk about 'Mobility and Means of Transportation' (Pros & cons of bicycle, car, train)."
        ]
      }
    ]
  }
};

export function getRandomOfflineExam(level: ProficiencyLevel, module: string): ExamContent {
  const list = OFFLINE_EXAM_BANK[level]?.[module] || [];
  if (list.length === 0) {
    return {
      text: "Standard Text",
      textTranslation: "Standard translation",
      questions: [
        {
          question: "Beispielfrage?",
          questionTranslation: "Sample question?",
          options: ["A", "B", "C"],
          correctAnswer: "A"
        }
      ]
    };
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

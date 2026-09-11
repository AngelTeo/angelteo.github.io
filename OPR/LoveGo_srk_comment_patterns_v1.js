/* SRK report-language authority v1
   NOT teacher input. NOT loaded by LoveGo UI.
   Built from retrievable 2025 PTM Card Comment BB/JR/IN forms.
   SR source URL is registered but source text is currently unavailable; do not invent SR-specific wording.
*/
window.LOVEGO_SRK_COMMENT_PATTERNS_V1={
  version:'1.0',
  role:'downstream_report_language_bank',
  source_status:{
    BB:{url:'https://form.jotform.com/SmartReader/ptm-card-comment-BB-2025',retrieved:true},
    JR:{url:'https://form.jotform.com/SmartReader/ptm-card-comment-JR-2025',retrieved:true},
    IN:{url:'https://form.jotform.com/SmartReader/ptm-card-comment-IN-2025',retrieved:true},
    SR:{url:'https://form.jotform.com/SmartReader/ptm-card-comment-SR-2025',retrieved:false}
  },
  rules:{
    evidence_required:true,
    teacher_second_pick:false,
    sensitive_self_care_auto_report:false,
    no_trait_only_negative_label:true,
    age_programme_specific_language:true
  },
  constructs:{
    character_positive:{
      evidence:['S5','S6'],
      concepts:['active','caring','happy','courteous','cooperative','calm'],
      note:'Use only when supported by repeated observable evidence; avoid fixed-personality claims.'
    },
    character_contextual_support:{
      evidence:['S5','S6','S9'],
      concepts:['mood regulation','playfulness affecting task','sensitivity','excessive talking','timidity/shyness'],
      note:'Write as contextual behaviour + support/recovery, never as a fixed negative identity.'
    },
    handwriting:{
      evidence_source:'academic_or_handwriting_evidence',
      levels:{
        strong:['engages positively with handwriting','shows secure foundational control','produces neat and careful written work'],
        developing:['shows steady improvement with guidance','is developing pencil control and neatness','participates and improves with practice'],
        support:['needs more consistent handwriting practice','needs support with pencil control and written neatness']
      }
    },
    academic_progress:{
      evidence_source:['EvalGo_or_academic_result','S3','S10'],
      levels:{
        strong:['participates actively and enjoys learning','shows curiosity and positive learning ownership','applies taught concepts with growing independence'],
        developing:['participates adequately and is making satisfactory progress','understands key basic concepts with some support'],
        support:['focus may interrupt learning progress','needs prompting to complete tasks','needs support to work more independently','shows gaps in understanding taught concepts']
      }
    },
    helpful:{evidence:['S6'],positive:['offers useful help to peers','responds when others need help']},
    friendly_caring:{evidence:['S6'],positive:['interacts warmly with peers','shows care toward classmates']},
    motivation:{evidence:['S3'],positive:['joins activities willingly','shows curiosity and initiative'],support:['relies heavily on external prompting or rewards to engage']},
    time_management:{evidence:['S4'],positive:['uses routine/task time constructively','completes familiar responsibilities within expected time'],support:['needs repeated prompting to finish familiar tasks on time']},
    respectful:{evidence:['S6'],positive:['speaks and acts respectfully with teachers and peers']},
    organisation:{evidence:['S4'],positive:['keeps belongings reasonably tidy and organised','takes care of personal items'],support:['needs help tracking and organising belongings']},
    peer_disruption:{evidence:['S6'],support:['sometimes interrupts or disrupts peer activity','needs support to participate without controlling or excluding others']},
    tiredness:{evidence_source:'daily_student_life_or_health_context',support:['is sometimes noticeably tired during school hours'],note:'Do not infer cause.'},
    closing_growth:{
      positive:['has shown steady progress this term','is developing stronger learning habits'],
      support:['will benefit from consistent effort and guided practice','is encouraged to stay actively engaged with learning']
    }
  },
  programme_notes:{
    BB:'Use short, developmental, encouraging wording. Do not overstate academic independence.',
    JR:'Use developmental wording similar to BB but allow more emerging-independence language.',
    IN:'May use stronger responsibility, task-completion and self-management language when evidence supports it.',
    SR:'SOURCE HOLD: do not add SR-specific phrases until the actual 2025 SR form content is retrieved.'
  }
};

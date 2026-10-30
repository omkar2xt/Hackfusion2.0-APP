import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import LearningModuleModel, QuizQuestionModel, LearningProgressModel, IncidentModel
from app.schemas.coach import (
    LearningModuleResponse,
    QuizQuestionResponse,
    QuizResultResponse,
    UserLearningProgressResponse
)

DEFAULT_MODULES = [
    {
        "slug": "phishing-defense",
        "title": "Spotting Campus Phishing & Urgency Traps",
        "category": "phishing",
        "description": "Learn to detect urgent account closure threats, lookalike login portals, and deceptive sender addresses.",
        "estimated_minutes": 3,
        "icon_name": "MailWarning",
        "content_markdown": """# Spotting Campus Phishing & Urgency Traps

Attackers frequently target university students by fabricating extreme urgency:
- **"Account Suspended in 24 Hours":** Universities rarely disable accounts without prior formal notification.
- **Inspect the Domain Carefully:** Look closely at the browser address bar. `campus.edu.portal-verify.xyz` is NOT `campus.edu`.
- **Never Approve Unexpected 2FA Prompts:** If you receive a Duo or Authenticator push you didn't initiate, press **Deny** immediately.

### Key Rule:
Always navigate directly to the campus portal by typing the address yourself or using your browser bookmarks, never by clicking links in panic-inducing messages.
""",
        "questions": [
            {
                "question_text": "You receive an email claiming: 'URGENT: Your student portal will be locked in 2 hours unless you confirm your password'. What should you do?",
                "options_json": [
                    "Click the link immediately to prevent losing account access",
                    "Forward the email to all your classmates to warn them",
                    "Do not click the link; verify your account status directly via official campus IT channels",
                    "Reply to the email with your campus ID number only"
                ],
                "correct_index": 2,
                "explanation": "Official university IT administrators will never demand password confirmation via email links under urgent threats."
            },
            {
                "question_text": "Which of the following domains represents a legitimate campus sub-domain?",
                "options_json": [
                    "https://campus.edu.verify-login.xyz",
                    "https://library.campus.edu",
                    "http://192.168.1.10/campus.edu",
                    "https://campus-edu-portal.com"
                ],
                "correct_index": 1,
                "explanation": "In standard DNS hierarchy, 'library.campus.edu' is an authorized subdomain ending in 'campus.edu'."
            }
        ]
    },
    {
        "slug": "qr-code-guardian",
        "title": "Quishing: Guarding Against Malicious QR Stickers",
        "category": "qr_scams",
        "description": "Physical flyer tampering is rising on campus noticeboards and cafeteria tables. Learn how to verify before scanning.",
        "estimated_minutes": 2,
        "icon_name": "QrCode",
        "content_markdown": """# Quishing: Malicious QR Codes

**Quishing** (QR Phishing) occurs when an attacker places a physical sticker over a legitimate poster:
- **Noticeboard Stickers:** An attacker places a fraudulent sticker over an event flyer, redirecting to credential harvesters.
- **No Preview Trap:** Standard camera apps often prompt you to open links blindly.
- **Payment Diversion:** Fraudulent QR stickers placed over cafeteria or parking payment stands.

### Key Rule:
Use SignalSafe QR Guardian. It renders the full destination text and checks against the verified campus registry before opening.
""",
        "questions": [
            {
                "question_text": "Why are physical QR codes placed on campus boards vulnerable to cyberattacks?",
                "options_json": [
                    "QR codes emit malicious radio signals",
                    "Attackers can easily stick replacement malicious QR stickers over legitimate university flyers",
                    "QR codes only work on jailbroken phones",
                    "They cannot be scanned in daylight"
                ],
                "correct_index": 1,
                "explanation": "Physical tampering (attaching a deceptive sticker over an official poster) is the primary method of quishing attacks."
            }
        ]
    },
    {
        "slug": "fake-payment-scams",
        "title": "Tuition Baiting & Fake Bursar Refunds",
        "category": "payment_fraud",
        "description": "Protect yourself from fake scholarship disbursements, wire fee demands, and gift card fraud.",
        "estimated_minutes": 3,
        "icon_name": "CreditCard",
        "content_markdown": """# Tuition Baiting & Fee Scams

Scammers exploit student financial anxieties through two major tactics:
1. **Unclaimed Bursary / Refund Scam:** Prompts students to submit banking login details to receive an unexpected university grant.
2. **Gift Card / Wire Demands:** Claiming tuition is overdue and requesting payment via wire transfer, cryptocurrency, or retail gift cards.

### Key Rule:
University tuition and fee payments are EXCLUSIVELY processed through the official university payment gateway (`payments.campus.edu`). The university never accepts gift cards or personal peer-to-peer apps.
""",
        "questions": [
            {
                "question_text": "A caller claiming to represent the Financial Aid Office asks you to pay an overdue registration fee with Google Play gift cards. This is:",
                "options_json": [
                    "A convenient new payment method accepted by university bursars",
                    "A guaranteed scam; universities never accept gift cards for tuition fees",
                    "Standard procedure for late payment penalties",
                    "Acceptable if you receive a verbal confirmation number"
                ],
                "correct_index": 1,
                "explanation": "Gift card payment requests are universal signatures of financial fraud. No legitimate educational institution accepts gift cards for tuition."
            }
        ]
    }
]


class SafetyCoachService:
    @classmethod
    def seed_defaults(cls, db: Session):
        if db.query(LearningModuleModel).count() == 0:
            for i, mod in enumerate(DEFAULT_MODULES):
                mod_record = LearningModuleModel(
                    id=str(uuid.uuid4()),
                    slug=mod["slug"],
                    title=mod["title"],
                    category=mod["category"],
                    description=mod["description"],
                    estimated_minutes=mod["estimated_minutes"],
                    content_markdown=mod["content_markdown"],
                    icon_name=mod["icon_name"],
                    order_index=i
                )
                db.add(mod_record)
                db.commit()
                db.refresh(mod_record)

                for q in mod["questions"]:
                    q_record = QuizQuestionModel(
                        id=str(uuid.uuid4()),
                        module_id=mod_record.id,
                        question_text=q["question_text"],
                        options_json=q["options_json"],
                        correct_index=q["correct_index"],
                        explanation=q["explanation"]
                    )
                    db.add(q_record)
                db.commit()

    @classmethod
    def list_modules(cls, db: Session) -> List[LearningModuleResponse]:
        cls.seed_defaults(db)
        modules = db.query(LearningModuleModel).order_by(LearningModuleModel.order_index).all()
        results = []
        for m in modules:
            questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.module_id == m.id).all()
            q_responses = [
                QuizQuestionResponse(
                    id=q.id,
                    question_text=q.question_text,
                    options_json=q.options_json,
                    explanation=q.explanation or ""
                )
                for q in questions
            ]
            results.append(
                LearningModuleResponse(
                    id=m.id,
                    slug=m.slug,
                    title=m.title,
                    category=m.category,
                    description=m.description,
                    estimated_minutes=m.estimated_minutes,
                    content_markdown=m.content_markdown,
                    icon_name=m.icon_name,
                    order_index=m.order_index,
                    questions=q_responses
                )
            )
        return results

    @classmethod
    def get_module(cls, db: Session, slug: str) -> Optional[LearningModuleResponse]:
        cls.seed_defaults(db)
        m = db.query(LearningModuleModel).filter(LearningModuleModel.slug == slug).first()
        if not m:
            return None
        questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.module_id == m.id).all()
        q_responses = [
            QuizQuestionResponse(
                id=q.id,
                question_text=q.question_text,
                options_json=q.options_json,
                explanation=q.explanation or ""
            )
            for q in questions
        ]
        return LearningModuleResponse(
            id=m.id,
            slug=m.slug,
            title=m.title,
            category=m.category,
            description=m.description,
            estimated_minutes=m.estimated_minutes,
            content_markdown=m.content_markdown,
            icon_name=m.icon_name,
            order_index=m.order_index,
            questions=q_responses
        )

    @classmethod
    def submit_quiz(cls, db: Session, user_id: str, module_id: str, answers: List[int]) -> QuizResultResponse:
        questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.module_id == module_id).all()
        if not questions:
            return QuizResultResponse(
                module_id=module_id,
                score=0,
                total_questions=0,
                passed=False,
                correct_count=0,
                feedback="Module contains no quiz questions."
            )

        correct_count = 0
        for i, q in enumerate(questions):
            if i < len(answers) and answers[i] == q.correct_index:
                correct_count += 1

        total = len(questions)
        score_percent = round((correct_count / total) * 100) if total else 0
        passed = score_percent >= 70

        # Record or update progress
        progress = db.query(LearningProgressModel).filter(
            LearningProgressModel.user_id == user_id,
            LearningProgressModel.module_id == module_id
        ).first()

        if not progress:
            progress = LearningProgressModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                module_id=module_id,
                completed=passed,
                quiz_score=score_percent,
                completed_at=datetime.utcnow() if passed else None
            )
            db.add(progress)
        else:
            progress.quiz_score = max(progress.quiz_score, score_percent)
            if passed:
                progress.completed = True
                progress.completed_at = datetime.utcnow()

        db.commit()

        badge = "Campus Shield Guardian" if passed and score_percent == 100 else ("Security Apprentice" if passed else None)
        feedback = "Outstanding! You demonstrated strong threat awareness." if passed else "Good try. Review the lesson and re-take the quiz to earn your security badge."

        return QuizResultResponse(
            module_id=module_id,
            score=score_percent,
            total_questions=total,
            passed=passed,
            correct_count=correct_count,
            feedback=feedback,
            badge_awarded=badge
        )

    @classmethod
    def get_user_progress(cls, db: Session, user_id: str) -> UserLearningProgressResponse:
        cls.seed_defaults(db)
        total_modules = db.query(LearningModuleModel).count()
        progress_records = db.query(LearningProgressModel).filter(
            LearningProgressModel.user_id == user_id,
            LearningProgressModel.completed == True
        ).all()

        completed_ids = [p.module_id for p in progress_records]
        completed_count = len(completed_ids)

        avg_score = 0.0
        if progress_records:
            avg_score = round(sum(p.quiz_score for p in progress_records) / len(progress_records), 1)

        if completed_count >= 3 and avg_score >= 85:
            level = "Campus Shield Guardian"
        elif completed_count >= 1:
            level = "Security Apprentice"
        else:
            level = "Cyber Novice"

        # Adaptive recommendations: check recent incident patterns on campus
        all_modules = cls.list_modules(db)
        # Recommend uncompleted modules first
        uncompleted = [m for m in all_modules if m.id not in completed_ids]
        recommended = uncompleted[:2] if uncompleted else all_modules[:2]

        return UserLearningProgressResponse(
            total_modules=total_modules,
            completed_modules=completed_count,
            average_score=avg_score,
            coach_level=level,
            completed_module_ids=completed_ids,
            recommended_modules=recommended
        )


safety_coach_service = SafetyCoachService()

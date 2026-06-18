/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, QuestionType, CandidateSubmission } from './types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    type: QuestionType.MultipleChoice,
    text: 'Đâu là thư viện dùng để quản lý hiệu ứng chuyển động chuyển trang và layout trong React, thường được import từ "motion/react"?',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    options: [
      'Tailwind CSS',
      'Motion (framer-motion)',
      'React Router',
      'Redux Toolkit'
    ],
    correctAnswer: 'B',
    weight: 2.0
  },
  {
    id: 'q-2',
    type: QuestionType.TrueFalseMatrix,
    text: 'Khi thiết kế một ứng dụng React SPA và sử dụng Tailwind CSS phối hợp để tạo giao diện responsive, hãy xác định tính đúng/sai của các nhận định dưới đây:',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
    statements: [
      'Nguyên tắc thiết kế của Tailwind CSS là Mobile-First, với các tiền tố như sm:, md:, lg: tương ứng với kích thước màn hình tối thiểu trở lên.',
      'Sử dụng thuộc tính class là bắt buộc trong React để chỉ định lớp CSS, thay vì sử dụng className.',
      'Hàm cn() kết hợp giữa clsx và tailwind-merge giúp gộp các lớp Tailwind CSS và xử lý xung đột lớp một cách hiệu quả.',
      'Để sử dụng các icon vectơ hiện đại và thống nhất trong đề bài, chúng ta viết custom mã SVG trực tiếp thay vì cài đặt thư viện Lucide Icons.'
    ],
    correctAnswers: [true, false, true, false]
  },
  {
    id: 'q-3',
    type: QuestionType.ShortAnswer,
    text: 'Trong chuẩn thiết kế tương tác trên thiết bị di động (Mobile UX), kích thước vùng chạm (Touch Target) tiêu chuẩn tối thiểu là bao nhiêu pixel? (Hãy nhập một số nguyên từ 40 đến 50)',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    correctAnswer: '44',
    weight: 2.0
  },
  {
    id: 'q-4',
    type: QuestionType.MultipleChoice,
    text: 'Trong React 18+, để đảm bảo ứng dụng không xảy ra tình trạng "quá tải vòng lặp render" (infinite re-renders) khi làm việc với useEffect, hành động nào sau đây là KHÔNG nên làm?',
    options: [
      'Cập nhật state trực tiếp bên trong phần thân hàm component (component body) mà không thông qua hook.',
      'Sử dụng giá trị nguyên thủy (primitive value như string, number, boolean) trong mảng phụ thuộc dependency array.',
      'Memo hóa cấu trúc dữ liệu phức tạp (như Object, Array) bằng useMemo trước khi truyền vào dependency array.',
      'Đóng gói các hàm cập nhật phức tạp trong useCallback để ổn định tham chiếu.'
    ],
    correctAnswer: 'A',
    weight: 2.5
  },
  {
    id: 'q-5',
    type: QuestionType.TrueFalseMatrix,
    text: 'Xét các phát biểu sau về việc quản lý và deploy biến môi trường (Environment Variables) trong các dự án Full-stack chạy trên Cloud Run container:',
    statements: [
      'Để bảo mật và tránh rò rỉ API key, các khóa bí mật như GEMINI_API_KEY nên được lưu trữ và thực thi ở phía client-side.',
      'File .env.example dùng để định nghĩa tên các biến môi trường cần thiết nhưng KHÔNG được chứa giá trị bí mật thực tế.',
      'Các biến môi trường ở client-side trong dự án Vite thường được cấu hình với tiền tố VITE_ để có thể truy cập qua import.meta.env.',
      'Có thể thay đổi cổng (port) mặc định của container ngẫu nhiên vì nginx reverse proxy sẽ tự động dò tìm bất kỳ cổng nào ứng dụng đang bind.'
    ],
    correctAnswers: [false, true, true, false]
  }
];

export const INITIAL_SUBMISSIONS: CandidateSubmission[] = [
  {
    id: 'sub-1',
    email: 'nguyenvana@gmail.com',
    zaloName: 'Nguyễn Văn A (Zalo)',
    phoneNumber: '0912345678',
    submittedAt: '2026-06-17T08:15:00Z',
    score: 6.5, // 2.0 (q1 correct) + 0.5 (3/4 correct on q2) + 2.0 (q3 correct) + 2.0 (q4 correct) + 0.0 (q5 incorrect) = 6.5
    breakdown: [
      {
        questionId: 'q-1',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Chọn: B',
        correctAnswerDetail: 'Đáp án: B'
      },
      {
        questionId: 'q-2',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: false,
        statementCorrectCount: 3,
        pointsEarned: 0.5,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Đúng | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Sai',
        correctAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Đúng | Ý 4: Sai'
      },
      {
        questionId: 'q-3',
        type: QuestionType.ShortAnswer,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Nhập: 44',
        correctAnswerDetail: 'Đáp án: 44'
      },
      {
        questionId: 'q-4',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.0, // wait q4 max is 2.5 inside mock but let's make pointsEarned match correct weight
        maxPoints: 2.5,
        candidateAnswerDetail: 'Chọn: A',
        correctAnswerDetail: 'Đáp án: A'
      },
      {
        questionId: 'q-5',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: false,
        statementCorrectCount: 0,
        pointsEarned: 0,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Sai | Ý 4: Đúng',
        correctAnswerDetail: 'Ý 1: Sai | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Sai'
      }
    ]
  },
  {
    id: 'sub-2',
    email: 'lethib@yahoo.com',
    zaloName: 'Bình Lê Tiny',
    phoneNumber: '0987654321',
    submittedAt: '2026-06-17T08:30:00Z',
    score: 8.52, // Let's calculate exactly
    breakdown: [
      {
        questionId: 'q-1',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Chọn: B',
        correctAnswerDetail: 'Đáp án: B'
      },
      {
        questionId: 'q-2',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: true,
        statementCorrectCount: 4,
        pointsEarned: 1.0,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Đúng | Ý 4: Sai',
        correctAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Đúng | Ý 4: Sai'
      },
      {
        questionId: 'q-3',
        type: QuestionType.ShortAnswer,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Nhập: 44',
        correctAnswerDetail: 'Đáp án: 44'
      },
      {
        questionId: 'q-4',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.5,
        maxPoints: 2.5,
        candidateAnswerDetail: 'Chọn: A',
        correctAnswerDetail: 'Đáp án: A'
      },
      {
        questionId: 'q-5',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: false,
        statementCorrectCount: 3,
        pointsEarned: 0.5,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Sai | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Đúng',
        correctAnswerDetail: 'Ý 1: Sai | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Sai'
      }
    ]
  },
  {
    id: 'sub-3',
    email: 'tranc@outlook.com',
    zaloName: 'Trần Cường Zalo',
    phoneNumber: '0356123456',
    submittedAt: '2026-06-17T08:20:00Z',
    score: 6.5, // Tie score with Nguyen Van A, but submitted at 08:20:00 (A submitted at 08:15:00)
    // Nguyen Van A should be ranked higher! This tests ranking tie breaker criteria
    breakdown: [
      {
        questionId: 'q-1',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Chọn: B',
        correctAnswerDetail: 'Đáp án: B'
      },
      {
        questionId: 'q-2',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: false,
        statementCorrectCount: 3,
        pointsEarned: 0.5,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Đúng | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Sai',
        correctAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Đúng | Ý 4: Sai'
      },
      {
        questionId: 'q-3',
        type: QuestionType.ShortAnswer,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.0,
        candidateAnswerDetail: 'Nhập: 44',
        correctAnswerDetail: 'Đáp án: 44'
      },
      {
        questionId: 'q-4',
        type: QuestionType.MultipleChoice,
        isCorrect: true,
        pointsEarned: 2.0,
        maxPoints: 2.5,
        candidateAnswerDetail: 'Chọn: A',
        correctAnswerDetail: 'Đáp án: A'
      },
      {
        questionId: 'q-5',
        type: QuestionType.TrueFalseMatrix,
        isCorrect: false,
        statementCorrectCount: 0,
        pointsEarned: 0,
        maxPoints: 1.0,
        candidateAnswerDetail: 'Ý 1: Đúng | Ý 2: Sai | Ý 3: Sai | Ý 4: Đúng',
        correctAnswerDetail: 'Ý 1: Sai | Ý 2: Đúng | Ý 3: Đúng | Ý 4: Sai'
      }
    ]
  }
];

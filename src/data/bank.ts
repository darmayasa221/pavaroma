/**
 * Rekening tujuan transfer. Sengaja dipisah dari komponen supaya invoice dan
 * form order membaca sumber yang sama — nomor rekening yang berbeda di dua
 * tempat adalah cara paling mudah kehilangan pembayaran.
 */
export const BANK_ACCOUNT = {
  bank: 'BRI',
  bankFull: 'Bank Rakyat Indonesia',
  holder: 'YOGA PRATAMA',
  /** Disimpan tanpa spasi/tanda pisah — ini yang disalin pelanggan apa adanya. */
  number: '001701091008505',
} as const

/** 001701091008505 → 0017 0109 1008 505, hanya untuk dibaca mata. */
export const formatAccountNumber = (n: string): string =>
  n.replace(/(\d{4})(?=\d)/g, '$1 ')

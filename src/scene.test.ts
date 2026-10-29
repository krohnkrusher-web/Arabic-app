import { describe, expect, it } from 'vitest'
import { days } from './content'
import { matchReply } from './speech'

// Things a learner might really say, and what Abu Sami should understand. Day 1, ش ر ب.
const day1 = days[0].scene!
const said: [number, string, string | null][] = [
  [0, 'بدي قهوة لو سمحت', 'coffee'],
  [0, 'بشرب شاي بالنعنع', 'tea'],
  [0, 'اعطيني كاسة مي', 'water'],
  [0, 'عصير برتقان', 'juice'],
  [0, 'كوكا كولا', 'cola'],
  [0, 'بيرة', 'alcohol'],
  [0, 'شو عندك', 'other'],
  [0, 'مرحبا كيفك', null],
  [1, 'اه اكيد', 'yes'],
  [1, 'لا شكرا', 'no'],
  [1, 'بدون سكر', 'no'],
  [1, 'مع سكر لو سمحت', 'yes'],
  [1, 'ما بدي', 'no'],
  [2, 'كتير طيب', 'good'],
  [2, 'مش طيب', 'bad'],
  [2, 'حامض', 'bad'],
  [2, 'عادي', 'meh'],
  [3, 'قديش حقه', 'price'],
  [3, 'اديش', 'price'],
  [3, 'كم السعر', 'price'],
  [4, 'يسلمو ايديك', 'thanks'],
  [4, 'شكرا كتير', 'thanks'],
  [4, 'لا والله بدي ادفع', 'pay'],
]

describe('Day 1 scene understands real answers', () => {
  for (const [turn, text, id] of said) {
    it(`turn ${turn + 1}: ${text}`, () => {
      expect(matchReply(day1.turns[turn].replies, [text])?.id ?? null).toBe(id)
    })
  }

  it('accepts its own model answers', () => {
    day1.turns.forEach((t) => expect(matchReply(t.replies, [t.replies[0].ar])).toBe(t.replies[0]))
  })
})

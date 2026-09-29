export type Term = {
  term: string;
  ipa: string;
  pos: string;
  definition: string;
  example: string;
  /** optional extra tip for learners: stress shifts, word origin, collocations */
  note?: string;
};

const TERM_DATA = {
  intermediary: {
    term: "intermediary",
    ipa: "/ˌɪn.təˈmiː.di.ə.ri/",
    pos: "noun",
    definition: "A person or system that sits between two parties and passes information along.",
    example: "Every router on the path is an intermediary that could read an unencrypted message.",
  },
  kerckhoffs: {
    term: "Kerckhoffs's principle",
    ipa: "/ˈkɜːk.hɒfs ˈprɪn.sə.pəl/",
    pos: "noun",
    definition: "A cipher must stay secure even if everything about it is public — except the key.",
    example: "AES is public knowledge; thanks to Kerckhoffs's principle, only the key must stay secret.",
    note: "Auguste Kerckhoffs, 1883. Opposite of “security through obscurity”.",
  },
  keyspace: {
    term: "keyspace",
    ipa: "/ˈkiː.speɪs/",
    pos: "noun",
    definition: "The total number of possible keys a cipher can use.",
    example: "The Caesar cipher's keyspace is so small that you can try every key by hand.",
  },
  avalanche: {
    term: "avalanche effect",
    ipa: "/ˈæv.əl.ɑːntʃ ɪˌfekt/",
    pos: "noun",
    definition: "A tiny change in the input produces a completely different output.",
    example: "Because of the avalanche effect, changing one letter flips about half of the output bits.",
  },
  roll: {
    term: "roll your own crypto",
    ipa: "/rəʊl jɔːr əʊn ˈkrɪp.təʊ/",
    pos: "idiom",
    definition: "To invent your own encryption instead of using well-tested, peer-reviewed algorithms.",
    example: "Never roll your own crypto — use a library that experts have audited.",
    note: "Almost always used in the negative: “Don’t roll your own crypto.”",
  },
  distribution: {
    term: "key distribution problem",
    ipa: "/kiː ˌdɪs.trɪˈbjuː.ʃən ˈprɒb.ləm/",
    pos: "noun",
    definition: "The challenge of getting a secret key to someone safely over an insecure channel.",
    example: "Public-key cryptography finally solved the key distribution problem in the 1970s.",
  },
  trapdoor: {
    term: "trapdoor function",
    ipa: "/ˈtræp.dɔː ˌfʌŋk.ʃən/",
    pos: "noun",
    definition: "A function that is easy to compute but practically impossible to reverse — unless you know a secret.",
    example: "Multiplying two large primes is a trapdoor function: easy forward, very hard backward.",
  },
  agreement: {
    term: "key agreement",
    ipa: "/ˈkiː əˌɡriː.mənt/",
    pos: "noun",
    definition: "A protocol in which two parties create the same shared secret without ever sending it.",
    example: "Diffie–Hellman key agreement lets strangers create a shared secret in public.",
  },
  eavesdropper: {
    term: "eavesdropper",
    ipa: "/ˈiːvzˌdrɒp.ər/",
    pos: "noun",
    definition: "Someone who secretly listens to a private conversation.",
    example: "In cryptography, the eavesdropper is traditionally called Eve.",
    note: "Eve → eavesdropper. Alice & Bob are the honest users; Mallory is the malicious one.",
  },
  endpoint: {
    term: "endpoint",
    ipa: "/ˈend.pɔɪnt/",
    pos: "noun",
    definition: "A device at either end of a communication — your phone or your laptop.",
    example: "In E2EE, messages are decrypted only on the endpoints, never on the server.",
  },
  honest: {
    term: "honest-but-curious",
    ipa: "/ˈɒn.ɪst bət ˈkjʊə.ri.əs/",
    pos: "adjective",
    definition: "Describes a party that follows the rules but tries to learn everything it can.",
    example: "We treat the server as honest-but-curious: it delivers messages, but it would read them if it could.",
  },
  prekey: {
    term: "prekey bundle",
    ipa: "/ˈpriː.kiː ˌbʌn.dəl/",
    pos: "noun",
    definition:
      "A set of public keys a user uploads in advance, so others can start an encrypted chat while they're offline.",
    example: "Signal fetches Bob's prekey bundle before Alice's first message.",
  },
  ephemeral: {
    term: "ephemeral",
    ipa: "/ɪˈfem.ər.əl/",
    pos: "adjective",
    definition: "Lasting for a very short time. An ephemeral key is used once and then deleted.",
    example: "Each session starts with an ephemeral key, so there is nothing long-lived to steal.",
  },
  forward: {
    term: "forward secrecy",
    ipa: "/ˈfɔː.wəd ˈsiː.krə.si/",
    pos: "noun",
    definition: "Stealing today's key does not let an attacker decrypt yesterday's messages.",
    example: "Thanks to forward secrecy, a key stolen today cannot unlock last year's messages.",
  },
  pcs: {
    term: "post-compromise security",
    ipa: "/pəʊst ˈkɒm.prə.maɪz sɪˈkjʊə.rə.ti/",
    pos: "noun",
    definition: "A protocol “heals” itself: after a key is stolen, future messages become secure again.",
    example: "The Double Ratchet provides post-compromise security by mixing in fresh randomness.",
    note: "Also called “future secrecy” or “self-healing”.",
  },
  ratchet: {
    term: "ratchet",
    ipa: "/ˈrætʃ.ɪt/",
    pos: "noun · verb",
    definition: "A mechanism that can move in only one direction. In crypto: keys that can't be rolled back.",
    example: "Every message ratchets the key forward; there is no way to turn it back.",
  },
  aitm: {
    term: "adversary-in-the-middle",
    ipa: "/ˈæd.və.sər.i ɪn ðə ˈmɪd.əl/",
    pos: "noun · AitM",
    definition: "An attacker who secretly sits between two people and relays — or changes — their messages.",
    example: "Comparing safety numbers defeats an adversary-in-the-middle who swapped the keys.",
    note: "The newer, neutral term for “man-in-the-middle (MITM)”.",
  },
  tofu: {
    term: "trust on first use",
    ipa: "/trʌst ɒn fɜːst juːs/",
    pos: "noun · TOFU",
    definition: "Accepting a key the first time you see it, and warning if it ever changes later.",
    example: "Signal relies on trust on first use, then shows a warning when a contact's key changes.",
    note: "Pronounced like the food: /ˈtəʊ.fuː/",
  },
  oob: {
    term: "out-of-band",
    ipa: "/ˌaʊt əv ˈbænd/",
    pos: "adjective",
    definition: "Using a separate channel — for example, meeting in person — to verify something.",
    example: "Scanning each other's QR code in person is out-of-band verification.",
  },
  zeroclick: {
    term: "zero-click exploit",
    ipa: "/ˈzɪə.rəʊ klɪk ˈek.splɔɪt/",
    pos: "noun",
    definition: "An attack that infects a device without the victim clicking or opening anything.",
    example: "Pegasus spyware used a zero-click exploit hidden in an iMessage attachment.",
    note: "Stress shift: an EXploit (noun) → to exPLOIT (verb).",
  },
  hndl: {
    term: "harvest now, decrypt later",
    ipa: "/ˈhɑː.vɪst naʊ diːˈkrɪpt ˈleɪ.tər/",
    pos: "noun · HNDL",
    definition: "Storing encrypted traffic today, hoping a future (quantum) computer can break it.",
    example: "Post-quantum encryption protects today's chats against harvest-now, decrypt-later attacks.",
  },
  exceptional: {
    term: "exceptional access",
    ipa: "/ɪkˈsep.ʃən.əl ˈæk.ses/",
    pos: "noun",
    definition: "A special mechanism that would let governments read encrypted data — critics call it a backdoor.",
    example: "Cryptographers argue that exceptional access cannot be built without weakening everyone's security.",
  },
  zeroaccess: {
    term: "zero-access encryption",
    ipa: "/ˈzɪə.rəʊ ˈæk.ses ɪnˈkrɪp.ʃən/",
    pos: "noun",
    definition: "The provider stores your data but has no technical ability to read it.",
    example: "Proton uses zero-access encryption, so even Proton cannot open your mailbox.",
  },
} satisfies Record<string, Term>;

export type TermKey = keyof typeof TERM_DATA;

export const TERMS: Record<TermKey, Term> = TERM_DATA;

/** Order used on the recap slide and the phone glossary. */
export const RECAP: TermKey[] = [
  "intermediary",
  "kerckhoffs",
  "keyspace",
  "avalanche",
  "roll",
  "distribution",
  "trapdoor",
  "agreement",
  "eavesdropper",
  "endpoint",
  "honest",
  "prekey",
  "ephemeral",
  "forward",
  "pcs",
  "ratchet",
  "aitm",
  "tofu",
  "oob",
  "zeroclick",
  "hndl",
  "exceptional",
  "zeroaccess",
];

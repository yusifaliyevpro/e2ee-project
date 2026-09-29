import { Deck } from "@/components/deck/Deck";
import { S01Title } from "@/components/slides/S01Title";
import { S02Postcard } from "@/components/slides/S02Postcard";
import { S03Caesar } from "@/components/slides/S03Caesar";
import { S04Aes } from "@/components/slides/S04Aes";
import { S05Keys } from "@/components/slides/S05Keys";
import { S06DiffieHellman } from "@/components/slides/S06DiffieHellman";
import { S07Transit } from "@/components/slides/S07Transit";
import { S08HowItWorks } from "@/components/slides/S08HowItWorks";
import { S09LiveDemo } from "@/components/slides/S09LiveDemo";
import { S10Ratchet } from "@/components/slides/S10Ratchet";
import { S11Safety } from "@/components/slides/S11Safety";
import { S12Limits } from "@/components/slides/S12Limits";
import { S13Why } from "@/components/slides/S13Why";
import { S14UseIt } from "@/components/slides/S14UseIt";
import { S15Vocab } from "@/components/slides/S15Vocab";
import { S16Thanks } from "@/components/slides/S16Thanks";

export default function PresentationPage() {
  return (
    <Deck>
      <S01Title />
      <S02Postcard />
      <S03Caesar />
      <S04Aes />
      <S05Keys />
      <S06DiffieHellman />
      <S07Transit />
      <S08HowItWorks />
      <S09LiveDemo />
      <S10Ratchet />
      <S11Safety />
      <S12Limits />
      <S13Why />
      <S14UseIt />
      <S15Vocab />
      <S16Thanks />
    </Deck>
  );
}

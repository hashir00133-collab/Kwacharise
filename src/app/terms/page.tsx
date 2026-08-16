export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-4xl">
        <a
          href="/register"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Register
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="text-4xl font-extrabold">
            KwachaRise — Terms &amp; Conditions
          </h1>

          <div className="mt-4 space-y-1 text-sm text-[#7a9abd]">
            <p>
              <strong className="text-[#dde2ef]">Last updated:</strong> June
              2025
            </p>
            <p>
              <strong className="text-[#dde2ef]">Platform:</strong>{" "}
              kwacharise.com
            </p>
            <p>
              <strong className="text-[#dde2ef]">Operated by:</strong>{" "}
              KwachaRise
            </p>
            <p>
              <strong className="text-[#dde2ef]">
                Country of Operation:
              </strong>{" "}
              Republic of Zambia
            </p>
          </div>

          <div className="mt-8 space-y-8 leading-7 text-[#b7c7dc]">
            <section>
              <h2 className="text-2xl font-bold text-white">
                1. About KwachaRise
              </h2>

              <p className="mt-3">
                KwachaRise is a peer-to-peer community gifting and mutual aid
                platform registered and operated in the Republic of Zambia. The
                platform connects community members who voluntarily choose to
                support one another financially on a direct, member-to-member
                basis.
              </p>

              <p className="mt-3">
                KwachaRise is not a bank, microfinance institution,
                deposit-taking institution, investment scheme, or registered
                financial service provider under the Banking and Financial
                Services Act No. 7 of 2017. KwachaRise does not hold, manage, or
                receive member funds at any point. All transactions occur
                directly between members via mobile money or cryptocurrency
                transfer.
              </p>

              <p className="mt-3">
                KwachaRise operates as a technology platform only. It
                facilitates matching, communication, and record-keeping between
                participating members.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                2. Legal Framework
              </h2>

              <p className="mt-3">
                These Terms and Conditions are governed by and construed in
                accordance with the laws of the Republic of Zambia, including
                but not limited to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  The Constitution of Zambia Amendment Act No. 2 of 2016,
                  Article 17, Right to Privacy
                </li>
                <li>The Data Protection Act No. 3 of 2021</li>
                <li>
                  The Electronic Communications and Transactions Act No. 4 of
                  2021
                </li>
                <li>The Cyber Security and Cyber Crimes Act No. 2 of 2021</li>
                <li>The Consumer Protection Act No. 24 of 2019</li>
                <li>
                  The Anti-Money Laundering provisions under the Financial
                  Intelligence Centre Act
                </li>
              </ul>

              <p className="mt-3">
                Any disputes arising from use of this platform shall be subject
                to the exclusive jurisdiction of the courts of the Republic of
                Zambia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                3. Eligibility
              </h2>

              <p className="mt-3">
                To register and participate on KwachaRise you must:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Be a natural person and not a company, trust, or organisation
                </li>
                <li>Be at least 18 years of age at the time of registration</li>
                <li>
                  Be a Zambian citizen or legal resident of the Republic of
                  Zambia
                </li>
                <li>
                  Provide accurate, complete, and truthful information during
                  registration and at all times
                </li>
                <li>
                  Complete identity verification, KYC, in compliance with
                  applicable Zambian law before making any withdrawal
                </li>
                <li>
                  Not be a person who has been convicted of financial fraud or
                  money laundering under Zambian law
                </li>
              </ul>

              <p className="mt-3">
                By creating an account you declare under your own responsibility
                that all of the above conditions are satisfied.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                4. Nature of Participation
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  4.1 Participation on KwachaRise is entirely voluntary. No
                  member is compelled to deposit, refer others, or continue
                  participation at any time.
                </p>

                <p>
                  4.2 KwachaRise is structured as a community gifting network.
                  Members who make deposits are matched with matured members who
                  receive funds as a community gift. This is not a loan,
                  investment contract, or financial product regulated under the
                  Banking and Financial Services Act No. 7 of 2017.
                </p>

                <p>
                  4.3 Returns on participation are not guaranteed. They depend
                  entirely on continued voluntary participation by new members.
                  KwachaRise makes no representation or promise of guaranteed
                  returns.
                </p>

                <p>
                  4.4 Members acknowledge that this platform is not regulated by
                  the Bank of Zambia and that participation carries inherent
                  risk. Members participate at their own informed decision and
                  risk.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                5. How the Platform Works
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  5.1 A member makes a voluntary deposit of a minimum amount as
                  set by the Super Admin, default K250, via an approved payment
                  method, Airtel Money, MTN Mobile Money, or USDT TRC20.
                </p>

                <p>
                  5.2 Once a platform admin confirms the deposit, a maturity
                  countdown begins. The default maturity period is 3 days and
                  may be adjusted by the Super Admin at any time.
                </p>

                <p>
                  5.3 Upon maturity, the member becomes eligible to receive a
                  community gift equivalent to a percentage of their deposited
                  amount as set by the Super Admin, default 50%.
                </p>

                <p>
                  5.4 Only the community gift portion is available for
                  withdrawal. The original deposited amount is automatically
                  reinvested into the member&apos;s next participation cycle.
                </p>

                <p>
                  5.5 Community gifts are funded directly by new members making
                  deposits. The platform pairs matured members with incoming
                  depositors who send payment directly to the matured
                  member&apos;s registered mobile money number. KwachaRise does
                  not transfer or hold these funds.
                </p>

                <p>
                  5.6 The member receiving payment must confirm receipt on the
                  platform. This confirmation activates the countdown timer for
                  the paying member.
                </p>

                <p>
                  5.7 A member may complete a maximum of 4 withdrawal cycles per
                  account activation. After 4 completed cycles the account is
                  marked as expired. The member must make a new deposit to
                  reactivate participation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                6. Identity Verification (KYC)
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  6.1 In compliance with applicable Zambian anti-money
                  laundering and financial crime prevention obligations, all
                  members are required to upload a valid National Registration
                  Card, NRC, or passport photo during registration.
                </p>

                <p>
                  6.2 KYC verification is reviewed and approved by platform
                  administrators.
                </p>

                <p>
                  6.3 Withdrawal requests will be blocked until KYC is fully
                  approved by an admin.
                </p>

                <p>
                  6.4 KwachaRise reserves the right to reject any KYC submission
                  that is fraudulent, unclear, expired, or unverifiable.
                </p>

                <p>
                  6.5 By submitting KYC documents you consent to KwachaRise
                  storing and processing that information solely for identity
                  verification purposes as permitted under the Data Protection
                  Act No. 3 of 2021.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">7. Deposits</h2>

              <div className="mt-3 space-y-3">
                <p>
                  7.1 Deposits are accepted via Airtel Money, MTN Mobile Money,
                  and USDT TRC20 only.
                </p>

                <p>
                  7.2 The minimum deposit amount is set by the Super Admin and
                  displayed on the deposit page at the time of submission.
                </p>

                <p>
                  7.3 Members must upload a screenshot or proof of payment when
                  submitting a deposit. Deposits submitted without proof may be
                  delayed or rejected.
                </p>

                <p>
                  7.4 Deposit confirmation is performed manually by a platform
                  admin. KwachaRise is not responsible for delays caused by
                  incorrect payment references, incomplete submissions, network
                  outages, or third party payment provider failures.
                </p>

                <p>
                  7.5 Once a deposit is confirmed and the countdown has started
                  it cannot be cancelled or refunded under any circumstances.
                </p>

                <p>
                  7.6 Members are responsible for ensuring they send the correct
                  amount to the correct payment details as displayed on the
                  platform at the time of deposit.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                8. Withdrawals and Pairing
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  8.1 A withdrawal request may only be submitted after the
                  maturity countdown has reached zero and KYC has been verified.
                </p>

                <p>
                  8.2 Withdrawals are processed through the pairing system. The
                  platform will match the withdrawing member with one or more
                  incoming depositors to fund the withdrawal.
                </p>

                <p>
                  8.3 Payment is sent directly from the paired depositor to the
                  withdrawing member&apos;s registered mobile number. KwachaRise
                  does not transfer, hold, or intermediate these funds in any
                  way.
                </p>

                <p>
                  8.4 Members with Gold tier status receive priority placement
                  in the pairing queue.
                </p>

                <p>
                  8.5 KwachaRise does not guarantee a specific timeframe for
                  pairing or payment completion. Processing time depends on the
                  availability of new deposits.
                </p>

                <p>
                  8.6 If a paired depositor fails to send payment within a
                  reasonable timeframe, the affected member must raise a dispute
                  through the Support section. KwachaRise will investigate and
                  may suspend or terminate the account of a member who defaults
                  on a confirmed pairing.
                </p>

                <p>
                  8.7 Once a member confirms receipt of payment on the platform,
                  the transaction is considered complete and cannot be reversed.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                9. Referral Programme
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  9.1 Members may refer new participants using their unique
                  referral link.
                </p>

                <p>
                  9.2 A referral bonus, default K50, is credited to the
                  referring member once the referred member&apos;s first deposit
                  is confirmed by an admin.
                </p>

                <p>
                  9.3 The referral bonus is a community incentive and does not
                  constitute a commission, wage, or financial product.
                </p>

                <p>
                  9.4 Self-referrals or referrals created through fraudulent or
                  deceptive means will be disqualified and may result in account
                  suspension without notice.
                </p>

                <p>
                  9.5 The referral bonus amount may be adjusted by the Super
                  Admin at any time without prior notice.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                10. Tier System
              </h2>

              <p className="mt-3">
                10.1 Members are assigned a participation tier based on the
                number of completed withdrawal cycles as follows:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Bronze: Cycles 1 to 3 — standard pairing queue</li>
                <li>Silver: Cycles 4 to 7 — priority pairing queue</li>
                <li>Gold: Cycles 8 and above — VIP priority pairing queue</li>
              </ul>

              <p className="mt-3">
                10.2 Tiers are calculated automatically by the system based on
                verified completed cycles.
              </p>

              <p className="mt-3">
                10.3 Tier status does not constitute a contractual right to
                specific pairing timelines or guaranteed returns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                11. Member Conduct and Prohibited Activities
              </h2>

              <p className="mt-3">
                In compliance with the Cyber Security and Cyber Crimes Act No. 2
                of 2021 and the Consumer Protection Act No. 24 of 2019, members
                agree not to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Register using false, stolen, or another person&apos;s
                  identity
                </li>
                <li>
                  Create multiple accounts or operate accounts on behalf of
                  others without disclosure
                </li>
                <li>
                  Attempt to manipulate, hack, or exploit the pairing, deposit
                  confirmation, or timer systems
                </li>
                <li>Harass, threaten, deceive, or defraud other members</li>
                <li>
                  Use the platform for money laundering, terrorist financing, or
                  any activity prohibited under Zambian law
                </li>
                <li>Share login credentials with any other person</li>
                <li>Upload fraudulent payment screenshots or KYC documents</li>
                <li>
                  Engage in any conduct that disrupts the fair operation of the
                  platform for other members
                </li>
              </ul>

              <p className="mt-3">
                Violation of any of the above may result in immediate account
                suspension, permanent termination, and referral to relevant
                Zambian law enforcement authorities where required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                12. Anti-Money Laundering
              </h2>

              <p className="mt-3">
                KwachaRise is committed to preventing the use of the platform
                for money laundering or the financing of illegal activities. In
                line with Zambia&apos;s financial crime prevention framework:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>All members must complete KYC verification before withdrawing</li>
                <li>
                  KwachaRise reserves the right to report suspicious activity to
                  the Financial Intelligence Centre of Zambia
                </li>
                <li>
                  Accounts involved in suspicious transaction patterns may be
                  suspended pending investigation
                </li>
                <li>
                  Large or unusual transaction volumes may be subject to
                  additional verification
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                13. Platform Fees
              </h2>

              <p className="mt-3">
                KwachaRise does not currently charge membership or transaction
                fees. This may change in future and all members will be notified
                in advance through the platform broadcast notification system
                before any fees come into effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                14. Limitation of Liability
              </h2>

              <div className="mt-3 space-y-3">
                <p>
                  14.1 KwachaRise is not liable for any financial loss arising
                  from member disputes, failed or delayed payments, pairing
                  delays, network failures, third party payment provider issues,
                  or platform downtime.
                </p>

                <p>
                  14.2 KwachaRise is not liable for losses resulting from a
                  member&apos;s own negligence, including depositing incorrect
                  amounts, providing incorrect mobile numbers, or failing to
                  confirm received payments within a reasonable time.
                </p>

                <p>
                  14.3 KwachaRise&apos;s total liability to any member in any
                  circumstance shall not exceed the value of fees paid by that
                  member to the platform, which at present is zero.
                </p>

                <p>
                  14.4 Nothing in these Terms limits liability for fraud,
                  willful misconduct, or death or personal injury caused by
                  negligence.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                15. Account Suspension and Termination
              </h2>

              <p className="mt-3">
                KwachaRise reserves the right to suspend or permanently close
                any account that:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Violates any provision of these Terms and Conditions</li>
                <li>Contains fraudulent or unverifiable identity information</li>
                <li>
                  Is involved in manipulation of platform processes or other
                  members
                </li>
                <li>
                  Is found to be involved in money laundering or financial crime
                </li>
                <li>
                  Has had no activity for a continuous period of 12 months
                </li>
              </ul>

              <p className="mt-3">
                Upon account termination any pending participation cycles or
                referral bonuses may be forfeited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                16. Future Bank Partnerships
              </h2>

              <p className="mt-3">
                KwachaRise intends to establish formal partnerships with
                licensed banking institutions in Zambia in future phases of the
                platform. When such partnerships are established, additional
                terms, regulated product disclosures, and compliance
                requirements may apply. Members will be notified of any material
                changes in advance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                17. Changes to These Terms
              </h2>

              <p className="mt-3">
                KwachaRise may update these Terms and Conditions at any time to
                reflect changes in operations, law, or platform features.
                Members will be notified of significant changes via the in-app
                broadcast system and by email. Continued use of the platform
                after changes are published constitutes acceptance of the
                updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                18. Severability
              </h2>

              <p className="mt-3">
                If any provision of these Terms is found to be invalid or
                unenforceable under Zambian law, that provision shall be
                modified to the minimum extent necessary to make it enforceable,
                and the remaining provisions shall continue in full force and
                effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white">
                19. Contact and Support
              </h2>

              <p className="mt-3">
                For questions, disputes, or support please contact the
                KwachaRise support team through the Support section on the
                platform at kwacharise.com. KwachaRise is a registered company
                under the Patents and Companies Registration Agency, PACRA, of
                the Republic of Zambia.
              </p>
            </section>

            <p className="rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5 text-sm text-[#00b86b]">
              By creating an account on KwachaRise, you confirm that you have
              read, understood, and agreed to these Terms and Conditions in full,
              and that you are entering into this agreement voluntarily and with
              full knowledge of the nature and risks of community gifting
              participation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
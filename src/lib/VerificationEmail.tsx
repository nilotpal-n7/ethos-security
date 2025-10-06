import { Html, Head, Font, Preview, Heading, Row, Section, Text, Button } from '@react-email/components';
  
interface VerificationEmailProps {
  username: string;
  otp: string;
  before: Date;
}

export default function VerificationEmail({ username, otp, before }: VerificationEmailProps) {
  const link = 'http://192.168.226.1:3000/sign-in'
  console.log('link', link)

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Verification Code</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Here&apos;s your verification code: {otp}</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for registering. Please use the following verification
            code to complete your registration befor {before.toLocaleString()}:
          </Text>
        </Row>
        <Row>
          <Text>{otp}</Text> 
        </Row>
        <Row>
          <Text>
            If you did not request this code, please ignore this email.
          </Text>
        </Row>
        { <Row>
          <Button
            href={link}
            style={{ color: '#61dafb' }}
          >
            Verify here
          </Button>
        </Row> }
      </Section>
    </Html>
  );
}

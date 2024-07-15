import { useEffect, useState } from "react";
import { Rows, Switch, SegmentedControl, FormField, TextInput, Select, Box, Button, LoadingIndicator } from "@canva/app-ui-kit";
import { auth } from "@canva/user";
import { EmailConfiguration, EmailRepetition, EmailSection } from "./models";
import { getCurrentUser, updateCurrentUserConfig } from "./services/api";

const DEFAULT_CONFIGURATION: EmailConfiguration = {
    email: "",
    time: 10,
    repetition: EmailRepetition.Daily,
    timezone: (new Date()).getTimezoneOffset().toString(),
    sections: [EmailSection.Access, EmailSection.Reviews, EmailSection.Comments, EmailSection.Shares],
};

const SECTION_LABELS: Record<EmailSection, string> = {
    [EmailSection.Access]: "Access requests and invitations",
    [EmailSection.Reviews]: "Approvals and reviews",
    [EmailSection.Comments]: "New comments and replies",
    [EmailSection.Shares]: "Sharings",
};

/*const SECTION_DESCRIPTIONS: Record<EmailSection, string> = {
    [EmailSection.Access]: "When someone requests access to your design or invites you to a team",
    [EmailSection.Reviews]: "When someone requests your approval or reviews your design",
    [EmailSection.Comments]: "When someone comments on your design or replies to your comments",
    [EmailSection.Shares]: "When someone shares design with you",
};*/

export const Configuration = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [configuration, setConfiguration] = useState<EmailConfiguration>(DEFAULT_CONFIGURATION);

    const init = async () => {
        const user = await getCurrentUser();
        setIsInitialized(true);
        if (!user?.refreshToken) {
            return;
        }

        setIsConnected(true);

        if (user.configuration) {
            setConfiguration(user.configuration);
        }
    };

    useEffect(() => {
        init();
    }, []);


    const onChange = (key: keyof EmailConfiguration) => (value: any) => {
        setConfiguration((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const getSectionValue = (section: EmailSection) => configuration.sections.includes(section);
    const onSectionChange = (section: EmailSection) => (value: boolean) => {
        setConfiguration((prev) => {
            let newSections = prev.sections;
            if (!value) {
                newSections = newSections.filter((s) => s !== section);
            } else {
                newSections = [...newSections, section];
                newSections = Object.keys(SECTION_LABELS).filter((s) => newSections.includes(s as EmailSection)) as EmailSection[];
            }
            
            return { ...prev, sections: newSections };
        });  
    };

    const onClick = async () => {
        console.log(configuration);
        if (!isConnected) {
            const response = await auth.requestAuthentication();
            console.log(response);
            if (response?.status !== "COMPLETED") {
                return;
            }
            setIsConnected(true);
        }
        setIsSending(true);
        await updateCurrentUserConfig(configuration);
        setIsSending(false);
    };

    if (!isInitialized) {
        return <Box padding="12u" alignItems="center" justifyContent="center"><LoadingIndicator size="large" /></Box>;
    }
    return (
        <Box padding="2u">
            <Rows spacing="3u">
                <FormField
                    label="What information would you like to see in your digest?"
                    control={(props) => (
                        <>
                            {Object.values(EmailSection).map((section) => (
                                <Switch
                                    key={section}
                                    value={getSectionValue(section)}
                                    onChange={onSectionChange(section)}
                                    label={SECTION_LABELS[section]}
                                    //description={SECTION_DESCRIPTIONS[section]}
                                />
                            ))}
                        </>
                    )}
                />
                <FormField
                    label="How often would you like to receive a digest?"
                    control={(props) => (
                        <SegmentedControl
                            value={configuration.repetition}
                            onChange={onChange("repetition")}
                            options={[
                                {
                                    label: "Everyday",
                                    value: EmailRepetition.Daily,
                                },
                                {
                                    label: "Weekly",
                                    value: EmailRepetition.Weekly,
                                },
                                {
                                    label: "Bi-weekly",
                                    value: EmailRepetition.BiWeekly,
                                },
                            ]}
                        />
                    )}
                />
                <FormField
                    label="At what time?"
                    control={(props) => (
                        <Select
                            stretch
                            value={configuration.time}
                            onChange={onChange("time")}
                            options={Array.from({ length: 24 }).map((_, i) => ({
                                label: `at ${i % 12}:00${i < 12 ? "AM" : "PM"}`,
                                value: i,
                            }))}
                        />
                    )}
                />
                <FormField
                    label="Email where to send your digest"
                    description="We respect your time, so we won’t send you anything but digest!"
                    control={(props) => (
                        <TextInput onChange={onChange("email")} name="email" value={configuration.email}/>
                    )}
                />
                <Button
                    alignment="center"
                    onClick={onClick}
                    variant="primary"
                    disabled={!configuration.email || isSending}
                >
                  Save and send me a preview
                </Button>
            </Rows>
        </Box>
    );
};
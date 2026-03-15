import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Form, useActionData, useLoaderData, useNavigation, useOutletContext } from "react-router";
import { Button } from "~/components/form/Button";
import { Fieldset } from "~/components/form/Fieldset";
import { Input } from "~/components/form/Input";
import { Label } from "~/components/form/Label";
import { getSettings, setSetting } from "~/model/database";

export const loader = async () => {
  return {
    settings: getSettings(),
  };
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const mediaDestination = formData.get("mediaDestination") as string;
  setSetting("mediaDestination", mediaDestination);

  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const actionData = useActionData();

  const [mediaDestination, setmediaDestination] = useState(
    settings.find((setting) => setting.key === "mediaDestination")?.value ?? ""
  );

  useEffect(() => {
    if (actionData?.success) {
      toast.success("Settings saved successfully!");
    }
  }, [actionData]);

  return (
    <div className="container">
      <h1>Settings</h1>
      <Form method="post">
        <Fieldset>
          <Label htmlFor="mediaDestination">Media Location</Label>
          <Input
            name="mediaDestination"
            type="text"
            value={mediaDestination}
            onChange={(e) => setmediaDestination(e.target.value)}
          />
          <Button
            type="submit"
            className="col-span-2 justify-self-start"
            disabled={navigation.state === "submitting"}
          >
            Save
          </Button>
        </Fieldset>
      </Form>
    </div>
  );
}

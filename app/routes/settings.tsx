import { Form } from "react-router";
import { Button } from "~/components/form/Button";
import { Fieldset } from "~/components/form/Fieldset";
import { Input } from "~/components/form/Input";
import { Label } from "~/components/form/Label";

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const mediaLocation = formData.get("mediaLocation") as string;

  return null;
};

export default function Settings() {
  return (
    <div className="container">
      <h1>Settings</h1>
      <Form method="post">
        <Fieldset>
          <Label htmlFor="mediaLocation" required>
            Media Location
          </Label>
          <Input name="mediaLocation" type="text" required />
          <Button type="submit" className="col-span-2 justify-self-start">
            Save
          </Button>
        </Fieldset>
      </Form>
    </div>
  );
}

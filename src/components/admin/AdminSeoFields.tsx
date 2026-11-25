import { AdminField } from "@/components/admin/AdminField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "@/lib/catalog-seo";
import { invalidInputClass, type FieldErrors } from "@/lib/admin-validation";
import { siteUrl } from "@/lib/site";

type SeoValue = { metaTitle: string; metaDescription: string };

export function AdminSeoFields({
  idPrefix = "",
  value,
  defaults,
  path,
  errors,
  onChange,
}: {
  idPrefix?: string;
  value: SeoValue;
  defaults: { title: string; description: string };
  path: string;
  errors: FieldErrors;
  onChange: (field: keyof SeoValue, value: string) => void;
}) {
  const title = value.metaTitle.trim() || defaults.title;
  const description = value.metaDescription.trim() || defaults.description;
  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-border p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Search engine optimization (SEO)</h2>
        <p className="text-xs text-muted">
          Optional. Leave fields blank to use the automatically generated metadata.
        </p>
      </div>
      <AdminField
        label="SEO title"
        htmlFor={`${idPrefix}metaTitle`}
        error={errors.metaTitle}
        hint={`${value.metaTitle.length}/${SEO_TITLE_MAX} characters · Aim for 50–60 characters.`}
      >
        <Input
          id={`${idPrefix}metaTitle`}
          value={value.metaTitle}
          maxLength={SEO_TITLE_MAX}
          placeholder={defaults.title}
          onChange={(event) => onChange("metaTitle", event.target.value)}
          className={invalidInputClass(errors.metaTitle)}
        />
      </AdminField>
      <AdminField
        label="SEO description"
        htmlFor={`${idPrefix}metaDescription`}
        error={errors.metaDescription}
        hint={`${value.metaDescription.length}/${SEO_DESCRIPTION_MAX} characters · Aim for 150–160 characters.`}
      >
        <Textarea
          id={`${idPrefix}metaDescription`}
          value={value.metaDescription}
          maxLength={SEO_DESCRIPTION_MAX}
          placeholder={defaults.description}
          rows={3}
          onChange={(event) => onChange("metaDescription", event.target.value)}
          className={invalidInputClass(errors.metaDescription)}
        />
      </AdminField>
      <div className="min-w-0 space-y-1 rounded-lg bg-surface p-3">
        <p className="text-xs font-medium text-muted">Search result preview</p>
        <p className="break-all text-xs text-muted">{siteUrl(path)}</p>
        <p className="break-words text-base font-medium">{title}</p>
        <p className="break-words text-sm text-muted">{description}</p>
        <p className="text-[11px] text-muted">Google may show a different title or snippet.</p>
      </div>
    </section>
  );
}

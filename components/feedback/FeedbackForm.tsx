"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCreateFeedback } from "@/hooks/use-feedback";
import type { FeedbackPayload } from "@/types/feedback";

export default function FeedbackForm() {

    const router = useRouter();

    const createFeedback = useCreateFeedback();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({

        service_id: "",

        overall_rating: 5,

        staff_behavior: 5,

        waiting_time: 5,

        service_quality: 5,

        cleanliness: 5,

        satisfaction: "highly_satisfied",

        comment: "",

        gender: "",

        age: ""

    });

    async function handleSubmit(e: any) {

        e.preventDefault();

        setLoading(true);

        try {

            await createFeedback.mutateAsync({

                ...form,

                service_id: Number(form.service_id),

                age: Number(form.age)

            } as FeedbackPayload);

            router.push("/feedback/success");

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >

            <select

                value={form.service_id}

                onChange={(e) =>

                    setForm({

                        ...form,

                        service_id: e.target.value

                    })

                }

            >

                <option>

                    Select Service

                </option>

            </select>

            <input

                type="number"

                min={1}

                max={5}

                value={form.overall_rating}

                onChange={(e) =>

                    setForm({

                        ...form,

                        overall_rating: Number(e.target.value)

                    })

                }

            />

            <select

                value={form.satisfaction}

                onChange={(e) =>

                    setForm({

                        ...form,

                        satisfaction: e.target.value

                    })

                }

            >

                <option value="highly_satisfied">

                    Highly Satisfied

                </option>

                <option value="satisfied">

                    Satisfied

                </option>

                <option value="not_satisfied">

                    Not Satisfied

                </option>

            </select>

            <textarea

                value={form.comment}

                onChange={(e) =>

                    setForm({

                        ...form,

                        comment: e.target.value

                    })

                }

            />

            <button disabled={loading || createFeedback.isPending}>

                {loading || createFeedback.isPending ?

                    "Submitting..."

                    :

                    "Submit Feedback"

                }

            </button>

        </form>

    );

}
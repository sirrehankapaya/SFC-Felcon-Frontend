import { Phone, PhoneCall, ShieldAlert, Ambulance, Flame, Shield, Building, AlertTriangle } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { getEmergencyContacts } from '../../services/staffService';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const roleIcons = {
  'Security Desk': Shield,
  Fire: Flame,
  Ambulance: Ambulance,
  Management: Building,
};

const roleTones = {
  'Security Desk': 'warning',
  Fire: 'danger',
  Ambulance: 'danger',
  Management: 'brand',
};

export default function Emergency() {
  const collectionContacts = useCollection('emergencyContacts');
  const contacts = collectionContacts?.length ? collectionContacts : getEmergencyContacts();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Emergency Contacts"
        description="Direct phone lines for society security, emergency services, and administrative support."
      />

      {/* Prominent Emergency Banner */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-950">In case of emergency call</h2>
              <p className="mt-1 text-sm text-red-700">
                For immediate life safety or fire hazards, contact rescue services directly or notify the Main Gate Security immediately.
              </p>
            </div>
          </div>
          {contacts[0] && (
            <Button
              as="a"
              href={`tel:${contacts[0].phone}`}
              variant="danger"
              size="lg"
              className="shrink-0 font-semibold shadow"
            >
              <PhoneCall size={18} />
              Gate Security
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Emergency Contact Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Emergency & Helplines</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {contacts.map((contact) => {
            const IconComponent = roleIcons[contact.role] || PhoneCall;
            const tone = roleTones[contact.role] || 'neutral';

            return (
              <Card key={contact.id} className="flex flex-col justify-between">
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">{contact.name}</h3>
                        <Badge tone={tone} className="mt-1">
                          {contact.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-ink-400 font-medium uppercase tracking-wider">Phone Number</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="mt-0.5 inline-block text-2xl font-bold tracking-tight text-brand-700 hover:text-brand-800 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </CardBody>

                <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3">
                  <Button
                    as="a"
                    href={`tel:${contact.phone}`}
                    variant="primary"
                    className="w-full"
                  >
                    <Phone size={16} />
                    Call {contact.name}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Safety Info Card */}
      <Card>
        <CardHeader
          title="Important Guidelines"
          subtitle="Instructions for reporting incidents within society premises"
        />
        <CardBody className="space-y-2 text-sm text-ink-600 leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p>
              When reporting an emergency to Main Gate Security, clearly state your Block and Flat number along with the nature of the issue.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p>
              For maintenance emergencies (such as main water pipe burst or power outage), contact the Admin Office during operating hours (9 AM - 6 PM) or Gate Security off-hours.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
